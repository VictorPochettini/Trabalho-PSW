import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';

const NavbarAL = () => {
  const location = useLocation(); 

  return (
    <nav className="navbar navbar-expand-lg navbar-artbeat">
      <div className="container">
        <Link className="navbar-brand" to="/"> {/* ← Mude <a> para <Link> */}
          <img src={logo} alt="ArtBeat" width="80" height="80" className="me-2" />
        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Início
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/artistas" 
                className={`nav-link ${location.pathname === '/artistas' ? 'active' : ''}`}
              >
                Artistas
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/desafios" 
                className={`nav-link ${location.pathname === '/desafios' ? 'active' : ''}`}
              >
                Desafios
              </Link>
            </li>
          </ul>
          <div className="d-flex">
            <Link to="/cadastro" className="btn btn-outline-primary me-2">
              Cadastrar
            </Link>
            <Link to="/login" className="btn btn-primary me-5">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarLog;