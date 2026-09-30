import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'

const Splash = lazy(() => import('../pages/Splash'))
const Onboarding = lazy(() => import('../pages/Onboarding'))
const PreRegister = lazy(() => import('../pages/PreRegister'))
const CompanyRegistration = lazy(() => import('../pages/CompanyRegistration'))
const PersonRegistration = lazy(() => import('../pages/PersonRegistration'))
const Login = lazy(() => import('../pages/Login'))
const Catalogo = lazy(() => import('../pages/Catalogo'))
const CatalogoDetalle = lazy(() => import('../pages/CatalogoDetalle'))
const Publicar = lazy(() => import('../pages/Publicar'))
const EditarPublicacion = lazy(() => import('../pages/EditarPublicacion'))
const Perfil = lazy(() => import('../pages/Perfil'))
const Matching = lazy(() => import('../pages/Matching'))
const Chat = lazy(() => import('../pages/Chat'))
const PagoExito = lazy(() => import('../pages/PagoExito'))
const PagoCancelado = lazy(() => import('../pages/PagoCancelado'))
const NotFound = lazy(() => import('../pages/NotFound'))

const wrap = (el: JSX.Element) => <Suspense fallback={null}>{el}</Suspense>

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Splash />) },
  { path: '/splash', element: <Navigate to="/" replace /> },
  { path: '/onboarding', element: wrap(<Onboarding />) },
  { path: '/pre-register', element: wrap(<PreRegister />) },
  { path: '/company-registration', element: wrap(<CompanyRegistration />) },
  { path: '/person-registration', element: wrap(<PersonRegistration />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/catalogo', element: wrap(<Catalogo />) },
  { path: '/catalogo/:id', element: wrap(<CatalogoDetalle />) },
  {
    path: '/publicar',
    element: <ProtectedRoute>{wrap(<Publicar />)}</ProtectedRoute>,
  },
  {
    path: '/subproductos/:id/editar',
    element: <ProtectedRoute>{wrap(<EditarPublicacion />)}</ProtectedRoute>,
  },
  {
    path: '/perfil',
    element: <ProtectedRoute>{wrap(<Perfil />)}</ProtectedRoute>,
  },
  {
    path: '/matching',
    element: <ProtectedRoute>{wrap(<Matching />)}</ProtectedRoute>,
  },
  {
    path: '/chat/:id',
    element: <ProtectedRoute>{wrap(<Chat />)}</ProtectedRoute>,
  },
  {
    path: '/pago/exito',
    element: <ProtectedRoute>{wrap(<PagoExito />)}</ProtectedRoute>,
  },
  {
    path: '/pago/cancelado',
    element: <ProtectedRoute>{wrap(<PagoCancelado />)}</ProtectedRoute>,
  },
  { path: '*', element: wrap(<NotFound />) },
])
