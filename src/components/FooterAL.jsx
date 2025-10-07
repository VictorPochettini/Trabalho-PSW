import React from 'react';
//import '../css/FooterAL.css';

const FooterAL = () => {
  return (
    <footer className="artbeat-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-column me-3">
            <h3>ArtBeat</h3>
            <p>Conectando artistas independentes e amantes da música<br/> em uma plataforma colaborativa e inovadora.</p>
          </div>
          <div className="footer-column">
            <h3>Links Rápidos</h3>
            <ul>
              <li><a href="/">Início</a></li>
              <li><a href="/artistas">Artistas</a></li>
              <li><a href="/desafios">Desafios</a></li>
              <li><a href="/privacidade">Políticas de Privacidade</a></li>
              <li><a href="/termos">Termos De Uso</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2025 ArtBeat. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterAL;