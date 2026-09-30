// Cliente de API para conectar el frontend con el backend Express

import type { Empresa, SubproductoCatalogo, SubproductoDetalle, Usuario } from "@/types/ui";
import { FAMILIAS_MATERIAL, MUNICIPIOS_VALLE_ABURRA, UNIDADES_VOLUMEN, type UnidadVolumen } from "@/lib/constants";

// URL base de la API backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

type ApiResponse<T> = {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
} & T;

type BackendSubproducto = {
  id: number | string;
  id_empresa: number | string;
  nombre: string;
  descripcion?: string | null;
  id_familia_material: number;
  volumen_disponible: number;
  id_unidad_medida: number;
  id_municipio: number;
  direccion?: string | null;
  foto_url?: string | null;
  fecha_registro?: string;
  disponible: boolean;
  id_estado_publicacion?: number;
};

const UNIDAD_POR_ID: Record<number, UnidadVolumen> = { 1: "kg", 2: "ton", 3: "m3" };

// Obtiene el ID numérico del municipio a partir del nombre
function municipioId(nombre: string): number {
  const id = MUNICIPIOS_VALLE_ABURRA.indexOf(nombre) + 1;
  if (id < 1) throw new Error(`Municipio no válido: ${nombre}`);
  return id;
}

// Obtiene el nombre del municipio a partir de su ID
function municipioNombre(id: number): string {
  return MUNICIPIOS_VALLE_ABURRA[id - 1] || `Municipio ${id}`;
}

type BackendSubproductoWithEmpresa = BackendSubproducto & {
  empresa?: string
  empresa_nombre?: string
  municipio?: string
  familia?: string
  familia_material?: string
  unidad_volumen?: string
  unidad_medida_abreviatura?: string
}

function mapUnidad(item: BackendSubproductoWithEmpresa): UnidadVolumen {
  const abrev = item.unidad_medida_abreviatura || item.unidad_volumen
  if (abrev === 't' || abrev === 'ton') return 'ton'
  if (abrev === 'm3' || abrev === 'm³') return 'm3'
  if (abrev === 'kg') return 'kg'
  return UNIDAD_POR_ID[item.id_unidad_medida ?? 0] || 'kg'
}

function mapSubproducto(item: BackendSubproductoWithEmpresa): SubproductoDetalle {
  const familia =
    item.familia ||
    item.familia_material ||
    FAMILIAS_MATERIAL.find((option) => option.id === String(item.id_familia_material))?.nombre ||
    'Familia desconocida'
  const municipio = item.municipio || municipioNombre(item.id_municipio ?? 0)
  return {
    id: String(item.id),
    id_empresa: String(item.id_empresa),
    nombre: item.nombre,
    descripcion: item.descripcion || '',
    familia,
    id_familia: String(item.id_familia_material),
    id_municipio: item.id_municipio,
    municipio,
    id_unidad_medida: item.id_unidad_medida,
    unidad_volumen: mapUnidad(item),
    volumen_disponible: Number(item.volumen_disponible),
    empresa: item.empresa || item.empresa_nombre || 'Empresa',
    condiciones: '',
    estado_publicacion: item.disponible === false ? 'borrador' : 'publicado',
    id_estado_publicacion: item.id_estado_publicacion,
    disponible: item.disponible,
    fecha_publicacion: item.fecha_registro,
    image_url: item.foto_url ?? undefined,
    emoji: '',
  }
}

// Desempaqueta la respuesta verificando el flag ok
function unwrap<T>(response: ApiResponse<T>, key: string): T {
  if (!response.ok) throw new Error(response.error || "La API devolvió un error.");
  const value = response[key];
  if (value === undefined) throw new Error(`La API no devolvió la propiedad '${key}'.`);
  return value as T;
}

// Extrae el mensaje de error comprensible devuelto por el backend
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
  } catch {
    // Si no es JSON se intenta leer texto plano
  }
  try {
    const text = await res.text();
    if (text) return text;
  } catch {
    // Ignorar si no hay cuerpo
  }
  return fallback;
}

// Peticion POST generica con JSON
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await extractErrorMessage(res, `Error ${res.status} al procesar la solicitud.`);
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// Peticion GET generica
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  if (!res.ok) {
    const message = await extractErrorMessage(res, `Error ${res.status} al obtener los datos.`);
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const AUTH_BASE = API_BASE_URL.replace(/\/api$/, "");

async function authRequest(path: string, body: unknown): Promise<{ user?: { id: string; email: string; name?: string }; message?: string; error?: { message?: string } }> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || "No se pudo completar la autenticación.");
  }
  return data;
}

export async function registrarUsuario(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<Usuario> {
  const data = await authRequest("/api/auth/sign-up/email", {
    email: input.email,
    password: input.password,
    name: input.name || input.email.split("@")[0],
  });
  if (!data.user) throw new Error("No se pudo crear la cuenta.");
  return {
    id: data.user.id,
    email: data.user.email,
    fecha_registro: new Date().toISOString(),
    nombre: data.user.name,
  };
}

export async function loginUsuario(input: {
  email: string;
  password: string;
}): Promise<{ usuario: Usuario; empresa?: Empresa | null; persona?: unknown }> {
  await authRequest("/api/auth/sign-in/email", input);
  const me = await get<ApiResponse<{ id: string; email: string; name?: string }> & {
    usuario: { id: string; email: string; name?: string };
    empresa: Empresa | null;
  }>("/usuarios/me");
  if (!me.ok || !me.usuario) throw new Error(me.error || "No se pudo leer la sesión.");
  return {
    usuario: {
      id: me.usuario.id,
      email: me.usuario.email,
      fecha_registro: new Date().toISOString(),
      nombre: me.usuario.name,
      id_empresa: me.empresa?.id ?? null,
    },
    empresa: me.empresa,
  };
}

// Registro de datos de la empresa
export async function registrarEmpresa(input: Omit<Empresa, "id">): Promise<Empresa> {
  const response = await post<ApiResponse<Empresa>>("/empresas", input);
  return unwrap(response, "empresa");
}

// Registro de datos de la persona natural o reciclador
export async function registrarPersona(input: {
  id_usuario: string | number;
  nombre: string;
  cedula: string;
  id_municipio: number;
  id_rol: number;
}): Promise<{ id: number; nombre: string; id_usuario: number }> {
  const response = await post<ApiResponse<{ id: number; nombre: string; id_usuario: number }>>("/personas", input);
  return unwrap(response, "persona");
}

// Creacion de un nuevo subproducto
export async function registrarSubproducto(
  input: {
    id_empresa: string | number;
    nombre: string;
    descripcion?: string;
    id_familia: string;
    volumen_disponible: number;
    unidad_volumen: UnidadVolumen;
    municipio: string;
    direccion?: string;
    image_url?: string;
  }
): Promise<SubproductoDetalle> {
  const unidad = UNIDADES_VOLUMEN.find((option) => option.value === input.unidad_volumen);
  if (!unidad) throw new Error("La unidad de medida no es válida.");
  const response = await post<ApiResponse<BackendSubproducto>>("/subproductos", {
    id_empresa: Number(input.id_empresa),
    nombre: input.nombre,
    descripcion: input.descripcion,
    id_familia_material: Number(input.id_familia),
    volumen_disponible: input.volumen_disponible,
    id_unidad_medida: unidad.id,
    id_municipio: municipioId(input.municipio),
    direccion: input.direccion?.trim() || undefined,
    image_base64: input.image_url,
  });
  return mapSubproducto(unwrap(response, "subproducto"));
}

// Consulta de subproductos para el catalogo publico
export async function getCatalogo(params?: {
  query?: string;
  id_familia?: string;
  municipio?: string;
}): Promise<SubproductoCatalogo[]> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set("q", params.query);
  if (params?.id_familia) queryParams.set("familia", params.id_familia);
  if (params?.municipio) queryParams.set("municipio", params.municipio);
  const qs = queryParams.toString();
  const response = await get<ApiResponse<BackendSubproducto[]>>(`/catalogo${qs ? `?${qs}` : ""}`);
  return unwrap(response, "subproductos").map(mapSubproducto);
}

// Consulta detallada de un subproducto por ID
export async function getSubproductoDetalle(id: string): Promise<SubproductoDetalle> {
  const response = await get<ApiResponse<BackendSubproducto>>(`/subproductos/${id}`);
  return mapSubproducto(unwrap(response, "subproducto"));
}

// Obtener las publicaciones propias de una empresa
export async function getMisPublicaciones(id_empresa?: string): Promise<SubproductoDetalle[]> {
  const url = id_empresa ? `/subproductos/mis-publicaciones?id_empresa=${id_empresa}` : "/subproductos/mis-publicaciones";
  const response = await get<ApiResponse<BackendSubproducto[]>>(url);
  const payload = response as ApiResponse<BackendSubproducto[]> & { subproductos?: BackendSubproducto[]; publicaciones?: BackendSubproducto[] };
  const rows = payload.subproductos || payload.publicaciones;
  if (!response.ok) throw new Error(response.error || "La API devolvió un error.");
  if (!rows) throw new Error("La API no devolvió las publicaciones.");
  return rows.map(mapSubproducto);
}

// Actualizar datos de un subproducto
export async function actualizarSubproducto(
  id: string,
  id_empresa: string | number,
  input: Partial<Pick<SubproductoDetalle, "nombre" | "descripcion" | "volumen_disponible" | "image_url" | "disponible">> & { image_base64?: string }
): Promise<SubproductoDetalle> {
  const { image_url, image_base64, ...rest } = input;
  const response = await fetch(`${API_BASE_URL}/subproductos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id_empresa: Number(id_empresa),
      ...rest,
      ...(image_base64 ? { image_base64 } : image_url ? { foto_url: image_url } : {}),
    }),
  });
  const body = await response.json() as ApiResponse<BackendSubproducto>;
  if (!response.ok) throw new Error(body.error || "No se pudo actualizar el subproducto.");
  return mapSubproducto(unwrap(body, "subproducto"));
}

// Eliminar un subproducto
export async function eliminarSubproducto(id: string, id_empresa: string | number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subproductos/${id}?id_empresa=${encodeURIComponent(String(id_empresa))}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "No se pudo eliminar el subproducto.");
  }
}

// Cambiar el estado de publicacion
export async function cambiarEstadoPublicacion(
  id: string,
  id_empresa: string | number,
  publicar: boolean,
): Promise<SubproductoDetalle> {
  const response = await fetch(`${API_BASE_URL}/subproductos/${id}/publicar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id_empresa: Number(id_empresa), publicar }),
  });
  const body = await response.json() as ApiResponse<BackendSubproducto>;
  if (!response.ok) throw new Error(body.error || "No se pudo cambiar el estado de publicación.");
  return mapSubproducto(unwrap(body, "subproducto"));
}

// Eliminar la cuenta del usuario autenticado
export async function eliminarCuenta(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/usuarios/me`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "No se pudo eliminar la cuenta.");
  }
}

export type IntercambioPagado = {
  id: number;
  id_subproducto: number;
  fecha_intercambio: string;
  precio_final: number;
  direccion_entrega: string | null;
  subproducto: { id: number; nombre: string };
  vendedor: { id: string; nombre: string };
};

export async function getIntercambiosPagados(): Promise<IntercambioPagado[]> {
  const response = await get<{ ok: boolean; error?: string; intercambios?: IntercambioPagado[] }>("/intercambios?estado=pagado");
  if (!response.ok) throw new Error(response.error || "No se pudieron cargar los intercambios.");
  return response.intercambios ?? [];
}
