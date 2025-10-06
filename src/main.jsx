import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import Feed from './pages/Feed.jsx'
import DiscoverArtist from './pages/DiscoverArtist.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import PublicarMusica from './pages/PublicarMusica.jsx'
import PublicarImagem from './pages/PublicarImagem.jsx'
import PublicarLetra from './pages/PublicarLetra.jsx'
import InitialPage from './pages/InitialPage.jsx'
import ArtistsPage from './pages/ArtistsPage.jsx'
import ChallengePage from './pages/ChallengePage.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Login from './pages/Login.jsx'
import CreateAccount from './pages/CreateAccount.jsx'
import ForYou from './pages/ForYou.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <InitialPage/>
  },
  {
    path: "/feed",
    element: <Feed/>
  },
  {
    path: "/discover",
    element: <DiscoverArtist/>
  },
  {
    path: "/desafios",
    element: <ChallengePage/>
  },
  {
    path: "/publicar/imagem",
    element: <PublicarImagem/>
  },
  {
    path: "/publicar/letra",
    element: <PublicarLetra/>
  },
  {
    path: "/publicar/musica",
    element: <PublicarMusica/>
  },
  {
    path: "/artistas",
    element: <ArtistsPage/>
  },
  {
    path: "/perfil",
    element: <UserProfile/>
  },
  {
    path: "/login",   
    element: <Login/>
  },
  {
    path:"/cadastro",
    element:<CreateAccount/>
  },
  {
    path: "/populares", 
    element: <ForYou/>
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
