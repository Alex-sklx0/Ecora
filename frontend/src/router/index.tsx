import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import RegisterSubproductPage from '@/pages/RegisterSubproductPage'
import CatalogPage from '@/pages/CatalogPage'
import SubproductDetailPage from '@/pages/SubproductDetailPage'
import PostSubproductPage from '@/pages/PostSubproductPage'
import SplashPage from '@/pages/SplashPage'
import Splash1Page from '@/pages/Splash1Page'
import Splash2Page from '@/pages/Splash2Page'
import Splash3Page from '@/pages/Splash3Page'
import LoginPage from '@/pages/LoginPage'
import PreRegisterPage from '@/pages/PreRegisterPage'
import PersonRegistrationPage from '@/pages/PersonRegistrationPage'
import CompanyRegistrationPage from '@/pages/CompanyRegistrationPage'
import CommunicationPage from '@/pages/CommunicationPage'
import MatchingPage from '@/pages/MatchingPage'
import ProfilePage from '@/pages/ProfilePage'
import UpdateSubproductPage from '@/pages/UpdateSubproductPage'
import NotFoundPage from '@/pages/404NotFoundPage'
import DisablePostSubproduct from '@/pages/DisablePostSubproduct'
import Chat from '@/pages/Chat'
import PagoExito from '@/pages/PagoExito'
import PagoCancelado from '@/pages/PagoCancelado'

const guard = (element: JSX.Element) => <ProtectedRoute>{element}</ProtectedRoute>

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <SplashPage /> },
      { path: 'splash', element: <SplashPage /> },
      { path: 'splash1', element: <Splash1Page /> },
      { path: 'splash2', element: <Splash2Page /> },
      { path: 'splash3', element: <Splash3Page /> },
      { path: 'onboarding', element: <Navigate to="/splash1" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'pre-register', element: <PreRegisterPage /> },
      { path: 'person-registration', element: <PersonRegistrationPage /> },
      { path: 'company-registration', element: <CompanyRegistrationPage /> },
      { path: 'communication', element: <CommunicationPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'catalog/:id', element: <SubproductDetailPage /> },
      { path: 'catalogo', element: <Navigate to="/catalog" replace /> },
      { path: 'catalogo/:id', element: <CatalogRedirect /> },
      { path: 'profile', element: guard(<ProfilePage />) },
      { path: 'perfil', element: <Navigate to="/profile" replace /> },
      { path: 'subproduct/:id/edit', element: guard(<UpdateSubproductPage />) },
      { path: 'post-subproduct', element: guard(<PostSubproductPage />) },
      { path: 'publicar', element: <Navigate to="/post-subproduct" replace /> },
      { path: 'matching', element: guard(<MatchingPage />) },
      { path: 'chat/:id', element: guard(<Chat />) },
      { path: 'pago/exito', element: guard(<PagoExito />) },
      { path: 'pago/cancelado', element: guard(<PagoCancelado />) },
      { path: 'register', element: <Navigate to="/pre-register" replace /> },
      { path: 'subproducts/new', element: guard(<RegisterSubproductPage />) },
      { path: 'disable-post-subproduct', element: <DisablePostSubproduct /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function CatalogRedirect() {
  const { id } = useParams()
  return <Navigate to={`/catalog/${id}`} replace />
}
