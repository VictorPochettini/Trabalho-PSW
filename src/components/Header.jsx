// src/components/Header.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';

const Header = () => {
  const location = useLocation();
  
  const isActiveLink = (path) => {
    // Remove a barra inicial e compara os caminhos
    const currentPath = location.pathname.replace('/', '');
    const comparePath = path.replace('/', '');
    
    // Verifica se é a página inicial ou corresponde ao path
    return currentPath === '' && path === 'feed' || currentPath === comparePath;
  };

  return (
    <div className="topo">
      <header>
        <nav>
          <div className="imagemLogo">
            <img src={logo} className="logo" alt="logo art beat" />
          </div>
          <ul className="menu">
            <li className="dropdown">
              <a 
                href="/feed" 
                className={isActiveLink('feed') ? 'enfase' : ''}
              >
                Feed
              </a>
            </li>
            <li className="dropdown">
              <a 
                href="/discover" 
                className={isActiveLink('discover') ? 'enfase' : ''}
              >
                Artistas
              </a>
            </li>
            <li className="dropdown">
              <a 
                href="/desafios" 
                className={isActiveLink('desafios') ? 'enfase' : ''}
              >
                Desafios
              </a>
            </li>
            <li className="dropdown">
              <a href="/perfil">
                <i 
                  className="fa-solid fa-circle-user fa-xl" 
                  style={{ color: '#ffffff' }}
                ></i>
              </a>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;