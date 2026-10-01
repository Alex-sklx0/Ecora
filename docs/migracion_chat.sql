-- ============================================================
-- SCRIPT DE MIGRACIÓN: CHAT EN VIVO (Supabase PostgreSQL)
-- ============================================================

-- 1. Tabla de conversaciones (1 a 1 entre usuarios)
CREATE TABLE IF NOT EXISTS conversaciones (
  id                BIGSERIAL   PRIMARY KEY,
  id_usuario_a      TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  id_usuario_b      TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_mensaje_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_no_self_chat CHECK (id_usuario_a <> id_usuario_b)
);

-- Garantiza unicidad del par sin importar el orden (A,B) == (B,A)
CREATE UNIQUE INDEX IF NOT EXISTS uq_par_usuarios
  ON conversaciones (LEAST(id_usuario_a, id_usuario_b), GREATEST(id_usuario_a, id_usuario_b));

CREATE INDEX IF NOT EXISTS idx_conv_usuario_a  ON conversaciones(id_usuario_a);
CREATE INDEX IF NOT EXISTS idx_conv_usuario_b  ON conversaciones(id_usuario_b);
CREATE INDEX IF NOT EXISTS idx_conv_ultimo_msg ON conversaciones(ultimo_mensaje_at DESC);

-- 2. Tabla de mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id              BIGSERIAL   PRIMARY KEY,
  id_conversacion BIGINT      NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  id_emisor       TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  contenido       TEXT        NOT NULL CHECK (char_length(contenido) > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leido           BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_msg_conversacion ON mensajes(id_conversacion, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_msg_emisor        ON mensajes(id_emisor);
CREATE INDEX IF NOT EXISTS idx_msg_no_leidos     ON mensajes(id_conversacion, leido) WHERE leido = FALSE;
