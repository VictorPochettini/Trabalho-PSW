// src/components/Header.jsx
import React from 'react';
import logo from '../images/ArtBeat_Branco.png'; // Ajuste o caminho conforme necessário

const Header = () => {
  return (
    <div className="topo">
      <header>
        <nav>
          <div className="imagemLogo">
            <img src={logo} className="logo" alt="logo art beat" />
          </div>
          <ul className="menu">
            <li className="dropdown">
              <a href="Feed.html" className="enfase">
                Feed
              </a>
            </li>
            <li className="dropdown">
              <a href="ArtistasLogado.html">Artistas</a>
            </li>
            <li className="dropdown">
              <a href="DesafiosLogado.html">Desafios</a>
            </li>
            <li className="dropdown">
              <a href="PerfilUsuário.html">
                <i className="fa-solid fa-circle-user fa-xl" style={{ color: '#ffffff' }}></i>
              </a>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;