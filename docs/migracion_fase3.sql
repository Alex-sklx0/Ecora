-- ==================================================================
-- Script de Migración Completo - Ecora
-- Ejecutar en Supabase -> SQL Editor
-- ==================================================================

-- 1. Tablas de Autenticación de Better-Auth
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Ajuste de llaves foráneas a TEXT para id_usuario en empresas, personas e intercambios
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_id_usuario_fkey;
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_id_usuario_fkey;
ALTER TABLE empresas ALTER COLUMN id_usuario TYPE TEXT USING id_usuario::text;
ALTER TABLE personas ALTER COLUMN id_usuario TYPE TEXT USING id_usuario::text;
ALTER TABLE empresas ADD CONSTRAINT fk_empresas_user FOREIGN KEY (id_usuario) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE personas ADD CONSTRAINT fk_personas_user FOREIGN KEY (id_usuario) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE intercambios DROP CONSTRAINT IF EXISTS chk_intercambio_usuarios_distintos;
ALTER TABLE intercambios DROP CONSTRAINT IF EXISTS intercambios_id_usuario_comprador_fkey;
ALTER TABLE intercambios DROP CONSTRAINT IF EXISTS intercambios_id_usuario_vendedor_fkey;
ALTER TABLE intercambios ALTER COLUMN id_usuario_comprador TYPE TEXT USING id_usuario_comprador::text;
ALTER TABLE intercambios ALTER COLUMN id_usuario_vendedor TYPE TEXT USING id_usuario_vendedor::text;
ALTER TABLE intercambios ADD CONSTRAINT chk_intercambio_usuarios_distintos CHECK (id_usuario_comprador <> id_usuario_vendedor);
ALTER TABLE intercambios ADD CONSTRAINT fk_intercambios_comprador FOREIGN KEY (id_usuario_comprador) REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE intercambios ADD CONSTRAINT fk_intercambios_vendedor FOREIGN KEY (id_usuario_vendedor) REFERENCES "user"(id) ON DELETE CASCADE;

-- 3. Tabla de Frecuencia de Producto
CREATE TABLE IF NOT EXISTS frecuencia_producto (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO frecuencia_producto (id, nombre) VALUES
  (1, 'Una sola vez'),
  (2, 'Diario'),
  (3, 'Semanal'),
  (4, 'Mensual')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 4. Campos adicionales en subproductos
ALTER TABLE subproductos ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
ALTER TABLE subproductos ADD COLUMN IF NOT EXISTS disponible BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subproductos ADD COLUMN IF NOT EXISTS id_frecuencia BIGINT REFERENCES frecuencia_producto(id);

-- 5. Campos adicionales en empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);

-- 6. Campos de pago en intercambios
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE intercambios ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(30) NOT NULL DEFAULT 'pendiente';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_pago'
    ) THEN
        ALTER TABLE intercambios ADD CONSTRAINT chk_estado_pago
            CHECK (estado_pago IN ('pendiente','pagado','fallido','reembolsado'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_stripe_session'
    ) THEN
        ALTER TABLE intercambios ADD CONSTRAINT uq_stripe_session UNIQUE (stripe_session_id);
    END IF;
END $$;
