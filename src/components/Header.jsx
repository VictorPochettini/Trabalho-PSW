// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';

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
              <Link to="/" className="enfase">
                Feed
              </Link>
            </li>
            <li className="dropdown">
              <a href="ArtistasLogado.html">Artistas</a>
            </li>
            <li className="dropdown">
              <a href="DesafiosLogado.html">Desafios</a>
            </li>
            <li className="dropdown">
              {/* BOTÃO DO PERFIL - AGORA COM LINK */}
              <Link to="/profile" className="profile-link">
                <i className="fa-solid fa-circle-user fa-xl" style={{ color: '#ffffff' }}></i>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;