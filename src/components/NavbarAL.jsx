import React from 'react';

function NavbarAL() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{background: 'linear-gradient(120deg, #050225 0%, #0d0b33 40%, #2e2573 100%)'}}>
      <div className="container">
        <a className="navbar-brand" href="/">
          <img src="/images/ArtBeat_Branco.png" alt="ArtBeat" width="80" height="80" className="me-2" />
        </a>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link active" href="/">Início</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/artistas">Artistas</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/desafios">Desafios</a>
            </li>
          </ul>
          <div className="d-flex">
            <button className="btn btn-outline-primary me-2" onClick={() => window.location.href='/cadastro'}>Cadastrar</button>
            <button className="btn btn-primary" onClick={() => window.location.href='/login'}>Entrar</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavbarAL;