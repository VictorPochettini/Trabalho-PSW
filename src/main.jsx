import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import Feed from './pages/Feed.jsx';
import DiscoverArtist from './pages/DiscoverArtist.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import PublicarMusica from './pages/PublicarMusica.jsx';
import PublicarImagem from './pages/PublicarImagem.jsx';
import PublicarLetra from './pages/PublicarLetra.jsx';
import InitialPage from './pages/InitialPage.jsx';
import ArtistsPage from './pages/ArtistsPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Login from './pages/Login.jsx';
import CreateAccount from './pages/CreateAccount.jsx';
import ForYou from './pages/ForYou.jsx';
import EditProfile from './pages/EdicaodeConta.jsx';
import TermosDeUso from './pages/TermosDeUso.jsx';
import PoliticasPrivacidade from './pages/PoliticasPrivacidade.jsx';
import ChallengesPage from "./pages/L_ChallengePage.jsx";
import ChallengeDetail from "./pages/ChallengeDetail.jsx";
import { ParticipatePage } from "./pages/ParticipatePage.jsx";
import CreateChallenge from "./pages/CreateChallenge.jsx";



import { Provider } from "react-redux";
import store from "./redux/store";

import ProtectedRoute from './components/ProtectedRoute.jsx';

const router = createBrowserRouter([
  { path: "/", element: <InitialPage/> },
  { path: "/feed", element: <ProtectedRoute><Feed/></ProtectedRoute> },
  { path: "/discover", element: <ProtectedRoute><DiscoverArtist/></ProtectedRoute> },
  { path: "/previa_desafios", element: <ChallengePage/> },
  { path: "/publicar/imagem", element: <ProtectedRoute><PublicarImagem/></ProtectedRoute> },
  { path: "/publicar/texto", element: <ProtectedRoute><PublicarLetra/></ProtectedRoute> },
  { path: "/publicar/musica", element: <ProtectedRoute><PublicarMusica/></ProtectedRoute> },
  { path: "/artistas", element: <ArtistsPage/> },
  { path: "/user/:username", element: <UserProfile/> },
  { path: "/login", element: <Login/> }, // público
  { path: "/cadastro", element: <CreateAccount/> }, // público
  { path: "/populares", element: <ProtectedRoute><ForYou/></ProtectedRoute> },
  { path: "/edit-profile", element: <ProtectedRoute><EditProfile/></ProtectedRoute>},
  { path: "/termos", element: <TermosDeUso/> },
  { path: "/politicas", element: <PoliticasPrivacidade/> },
  {path: "/desafios", element: <ProtectedRoute><ChallengesPage /></ProtectedRoute>},
  {path:"/desafios/:id", element: <ProtectedRoute><ChallengeDetail /></ProtectedRoute>},
  {path: "/desafios/:id/participar", element: <ProtectedRoute><ParticipatePage /></ProtectedRoute>},
  {path: "/desafios/criar", element: <ProtectedRoute><CreateChallenge /></ProtectedRoute>}
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
