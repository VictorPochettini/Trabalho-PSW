/*import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import App from './pages/App.jsx'
import DiscoverArtist from './pages/DiscoverArtist.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import PublicarMusica from './pages/PublicarMusica.jsx'
import PublicarImagem from './pages/PublicarImagem.jsx'
import PublicarLetra from './pages/PublicarLetra.jsx'

const router = createBrowserRouter([
  {
    path: "/feed",
    element: <App/>
  },
  {
    path: "/discover",
    element: <DiscoverArtist/>
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
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)*/

/*bia: o meu só roda direito com o main assim*/
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


