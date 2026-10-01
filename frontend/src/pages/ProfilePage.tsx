// Pagina de perfil del usuario

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMisPublicaciones, getCatalogo, eliminarSubproducto, eliminarCuenta, actualizarSubproducto, getIntercambiosPagados, type IntercambioPagado } from "@/api/client";
import type { SubproductoCatalogo, SubproductoDetalle } from "@/types/ui";
import { chatApi, type Conversacion } from "@/services/chatApi";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState<SubproductoDetalle[]>([]);
  const [catalogo, setCatalogo] = useState<SubproductoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ id?: number; email?: string; nombre?: string; id_empresa?: string | number } | null>(null);
  const [intercambios, setIntercambios] = useState<IntercambioPagado[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login", { replace: true });
      return;
    }

    let companyId: string | undefined = undefined;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        if (parsed.id_empresa) {
          companyId = String(parsed.id_empresa);
        }
      } catch {
        // Ignorar error de parseo
      }
    }

    const pubsPromise: Promise<SubproductoDetalle[]> = companyId
      ? getMisPublicaciones(companyId)
      : Promise.resolve([]);

    Promise.all([pubsPromise, getCatalogo(), getIntercambiosPagados().catch(() => []), chatApi.getConversaciones().catch(() => ({ conversaciones: [] }))])
      .then(([misPubs, cat, pagos, chats]) => {
        setPublicaciones(misPubs);
        setCatalogo(cat);
        setIntercambios(pagos);
        setConversaciones(chats.conversaciones);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Cerrar sesion limpiando los datos locales
  async function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? "http://localhost:8000"}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    navigate("/catalog");
  }

  // Eliminar la cuenta del usuario tras confirmar
  async function handleDeleteAccount() {
    const confirm = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta?\n\nEsta acción es irreversible y eliminará todos tus datos, empresa y subproductos asociados."
    );
    if (!confirm) return;

    try {
      if (userData?.id) {
        await eliminarCuenta();
      }
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar la cuenta.");
    }
  }

  // Eliminar un subproducto propio
  async function handleDeleteSubproducto(id: string, nombre: string) {
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar el material "${nombre}"?`);
    if (!confirm) return;

    try {
      const companyId = userData?.id_empresa;
      if (!companyId) throw new Error("No se encontró la empresa propietaria.");
      await eliminarSubproducto(id, companyId);
      setPublicaciones((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar el subproducto.");
    }
  }

  // Cambiar la disponibilidad de una publicacion
  async function handleToggleDisponibilidad(publicacion: SubproductoDetalle) {
    const currentDisponibilidad = publicacion.disponible !== false;
    const newDisponibilidad = !currentDisponibilidad;
    setTogglingId(publicacion.id);

    // Actualización optimista en la UI
    setPublicaciones((prev) =>
      prev.map((p) => (p.id === publicacion.id ? { ...p, disponible: newDisponibilidad } : p))
    );

    try {
      const companyId = userData?.id_empresa;
      if (!companyId) throw new Error("No se encontró la empresa propietaria.");
      await actualizarSubproducto(publicacion.id, companyId, { disponible: newDisponibilidad });
    } catch (err) {
      // Revertir en caso de error
      setPublicaciones((prev) =>
        prev.map((p) => (p.id === publicacion.id ? { ...p, disponible: currentDisponibilidad } : p))
      );
      alert(err instanceof Error ? err.message : "Error al actualizar la disponibilidad.");
    } finally {
      setTogglingId(null);
    }
  }


  // Cuenta cuantos materiales del catalogo coinciden con la publicacion
  function getMatchesForSubproducto(p: SubproductoDetalle): number {
    return catalogo.filter(
      (c) => (c.id_familia === p.id_familia || c.familia === p.familia) && String(c.id) !== String(p.id)
    ).length;
  }

  const totalKg = publicaciones.reduce(
    (total, publicacion) => total + (publicacion.unidad_volumen === "kg" ? publicacion.volumen_disponible : 0),
    0,
  );

  const totalMatches = publicaciones.reduce(
    (acc, p) => acc + getMatchesForSubproducto(p),
    0
  );

  const displayName = userData?.nombre || userData?.email?.split("@")[0] || "Mi perfil";
  const displayEmail = userData?.email || "contacto@fibretex.co";

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{displayName}</h1>
        <p className="mt-1 text-sm text-ink-500">Gestiona publicaciones, contactos e historial.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.05fr_1.05fr_0.7fr]">
        {/* Tarjeta de informacion del perfil */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-surface-200">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4ed] font-bold text-[#00805b]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-ink-900">{displayName}</h2>
              <p className="text-xs text-ink-500">
                {userData && !userData.id_empresa
                  ? "Persona Natural / Reciclador · Valle de Aburrá"
                  : "Empresa Generadora / Transformadora · Valle de Aburrá"}
              </p>
            </div>
          </div>
          <dl className="mt-3 space-y-2 text-xs text-ink-500">
            <div>
              <dt className="inline font-bold text-ink-700">Tipo: </dt>
              <dd className="inline">
                {userData && !userData.id_empresa ? "Persona natural (Reciclador / Gestor)" : "Empresa (Aprovechador / Generador)"}
              </dd>
            </div>
            <div><dt className="inline font-bold text-ink-700">Contacto: </dt><dd className="inline">{displayEmail}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-bold text-ink-700 transition-colors hover:bg-surface-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar sesión</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 hover:border-red-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Eliminar cuenta</span>
            </button>
          </div>
        </section>

        {/* Tarjeta de resumen de estadisticas */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-surface-200">
          <h2 className="text-xs font-bold text-ink-700">Resumen</h2>
          <div className="mt-3 grid grid-cols-2 gap-y-4">
            <div><strong className="block text-xl text-ink-900">{userData && !userData.id_empresa ? "0" : publicaciones.length}</strong><span className="text-xs text-ink-500">Publicaciones</span></div>
            <div><strong className="block text-xl text-ink-900">{totalMatches}</strong><span className="text-xs text-ink-500">Matches reales</span></div>
            <div><strong className="block text-xl text-ink-900">{publicaciones.length > 0 ? publicaciones.length * 2 : 0}</strong><span className="text-xs text-ink-500">Contactos</span></div>
            <div><strong className="block text-xl text-ink-900">{userData && !userData.id_empresa ? "0 kg" : (totalKg >= 1000 ? `${(totalKg / 1000).toFixed(1)} t` : `${totalKg} kg`)}</strong><span className="text-xs text-ink-500">Material publicado</span></div>
          </div>
        </section>

      </div>

      {/* Contenido segun el tipo de usuario: persona o empresa */}
      {userData && !userData.id_empresa ? (
        <>
          <IntercambiosList intercambios={intercambios} loading={loading} isEmpresa={false} />
          <ChatsSection conversaciones={conversaciones} loading={loading} />
        </>
      ) : (
        <>
        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-surface-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Mis publicaciones</h2>
            
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-ink-500">Cargando publicaciones...</p>
          ) : publicaciones.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              <p className="text-sm">No has publicado ningún subproducto todavía.</p>
              <Link
                to="/post-subproduct"
                className="mt-3 inline-block rounded-xl bg-[#23ce6b] px-5 py-2 text-xs font-bold text-white hover:bg-[#1fb85f]"
              >
                Publicar mi primer material
              </Link>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="border-b border-surface-200 text-ink-700">
                <tr>
                  <th className="px-3 py-2.5 font-bold">Material</th>
                  <th className="px-3 py-2.5 font-bold">Familia</th>
                  <th className="px-3 py-2.5 font-bold">Cantidad</th>
                  <th className="px-3 py-2.5 font-bold">Estado</th>
                  <th className="px-3 py-2.5 font-bold">Matches</th>
                  <th className="px-3 py-2.5 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {publicaciones.map((publicacion) => {
                  const matchCount = getMatchesForSubproducto(publicacion);
                  return (
                    <tr key={publicacion.id} className="border-b border-surface-100 text-ink-600 hover:bg-surface-50">
                      <td className="px-3 py-3 font-semibold text-ink-900">{publicacion.nombre}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                          {publicacion.familia}
                        </span>
                      </td>
                      <td className="px-3 py-3">{publicacion.volumen_disponible} {publicacion.unidad_volumen}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleDisponibilidad(publicacion)}
                          disabled={togglingId === publicacion.id}
                          title={publicacion.disponible !== false ? "Clic para marcar sin stock" : "Clic para marcar disponible"}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                            publicacion.disponible !== false
                              ? "bg-[#dff4ed] text-[#00805b] hover:bg-[#c6ebd9] border border-[#a1d9be]"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                          } disabled:opacity-50`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              publicacion.disponible !== false ? "bg-[#00805b]" : "bg-amber-600 animate-pulse"
                            }`}
                          />
                          <span>{publicacion.disponible !== false ? "Disponible" : "Sin stock"}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                          matchCount > 0 ? "bg-[#dff4ed] text-[#00805b]" : "bg-surface-100 text-ink-400"
                        }`}>
                          ↔ {matchCount} {matchCount === 1 ? "coincidencia" : "coincidencias"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right space-x-2">
                        <Link
                          to={`/catalog/${publicacion.id}`}
                          className="font-bold text-ink-500 hover:text-ink-800 hover:underline"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/subproduct/${publicacion.id}/edit`}
                          className="font-bold text-[#00805b] hover:underline"
                        >
                          Editar
                        </Link>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteSubproducto(publicacion.id, publicacion.nombre)}
                          className="font-bold text-red-500 hover:text-red-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
        <IntercambiosList intercambios={intercambios} loading={loading} isEmpresa={true} />
        <ChatsSection conversaciones={conversaciones} loading={loading} />
        </>
      )}

     
    </div>
  );
}

function IntercambiosList({
  intercambios,
  loading,
  isEmpresa = false,
}: {
  intercambios: IntercambioPagado[];
  loading: boolean;
  isEmpresa?: boolean;
}) {
  return (
    <section className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-surface-200">
      <h2 className="mb-4 text-sm font-bold text-ink-900">Intercambios</h2>
      {loading ? (
        <p className="py-8 text-center text-sm text-ink-500">Cargando intercambios...</p>
      ) : intercambios.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">Aún no tienes intercambios pagados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-surface-200 text-ink-700">
              <tr>
                <th className="px-3 py-2.5 font-bold">Material</th>
                <th className="px-3 py-2.5 font-bold">{isEmpresa ? "Comprador" : "Vendedor"}</th>
                <th className="px-3 py-2.5 font-bold">Valor</th>
                <th className="px-3 py-2.5 font-bold">Fecha</th>
                <th className="px-3 py-2.5 font-bold">Entrega</th>
              </tr>
            </thead>
            <tbody>
              {intercambios.map((item) => (
                <tr key={item.id} className="border-b border-surface-100 text-ink-600">
                  <td className="px-3 py-3">
                    <Link
                      to={`/catalog/${item.id_subproducto}`}
                      className="font-semibold text-[#00805b] hover:underline"
                    >
                      {item.subproducto.nombre}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {isEmpresa
                      ? (item.comprador?.nombre || item.contraparte?.nombre || "—")
                      : (item.vendedor?.nombre || "—")}
                  </td>
                  <td className="px-3 py-3 font-semibold text-ink-900">
                    ${Number(item.precio_final).toLocaleString("es-CO")} COP
                  </td>
                  <td className="px-3 py-3">
                    {new Date(item.fecha_intercambio).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3 py-3">{item.direccion_entrega || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ChatsSection({
  conversaciones,
  loading,
}: {
  conversaciones: Conversacion[];
  loading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <section className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-surface-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-900">Mis chats</h2>
        <Link to="/chat" className="text-xs font-semibold text-[#00805b] hover:underline">
          Ver todos
        </Link>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-ink-500">Cargando chats...</p>
      ) : conversaciones.length === 0 ? (
        <div className="py-10 text-center text-ink-400">
          <div className="mb-2 text-4xl">💬</div>
          <p className="text-sm font-medium">Aún no tienes conversaciones.</p>
          <p className="mt-1 text-xs">Cuando alguien te contacte desde el catálogo, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {conversaciones.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/chat/${c.id}`)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-surface-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff4ed] font-bold text-[#00805b]">
                {c.contraparte.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">{c.contraparte.nombre}</span>
                  <span className="ml-2 shrink-0 text-[11px] text-ink-400">
                    {new Date(c.ultimo_mensaje_at).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="truncate text-xs text-ink-500 max-w-xs">
                    {c.ultimo_contenido
                      ? c.ultimo_contenido.startsWith("{")
                        ? "📦 Solicitud de intercambio"
                        : c.ultimo_contenido
                      : "Sin mensajes aún"}
                  </span>
                  {c.no_leidos > 0 && (
                    <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#22C55E] px-1 text-[11px] font-bold text-white">
                      {c.no_leidos > 9 ? "9+" : c.no_leidos}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
