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
import L_ChallengePage from './pages/L_ChallengePage.jsx'


import { Provider } from "react-redux";
import store from "./redux/store";

import ProtectedRoute from './components/ProtectedRoute.jsx';

const router = createBrowserRouter([
  { path: "/", element: <InitialPage/> },
  { path: "/feed", element: <ProtectedRoute><Feed/></ProtectedRoute> },
  { path: "/discover", element: <ProtectedRoute><DiscoverArtist/></ProtectedRoute> },
  { path: "/desafios", element: <ChallengePage/> },
  { path: "/publicar/imagem", element: <ProtectedRoute><PublicarImagem/></ProtectedRoute> },
  { path: "/publicar/letra", element: <ProtectedRoute><PublicarLetra/></ProtectedRoute> },
  { path: "/publicar/musica", element: <ProtectedRoute><PublicarMusica/></ProtectedRoute> },
  { path: "/artistas", element: <ArtistsPage/> },
  { path: "/perfil", element: <ProtectedRoute><UserProfile/></ProtectedRoute> },
  { path: "/login", element: <Login/> }, // público
  { path: "/cadastro", element: <CreateAccount/> }, // público
  { path: "/populares", element: <ProtectedRoute><ForYou/></ProtectedRoute> },
    { path: "/Ldesafios", element: <ProtectedRoute><L_ChallengePage/></ProtectedRoute> },
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
