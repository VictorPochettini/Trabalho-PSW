import React from 'react';

function FooterAL() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <h3>ArtBeat</h3>
            <p>Conectando artistas independentes e amantes da música em uma plataforma colaborativa e inovadora.</p>
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
          <div className="footer-column">
            <h3>Recursos</h3>
            <ul>
              <li><a href="/como-funciona">Como funciona</a></li>
              <li><a href="/para-artistas">Para artistas</a></li>
              <li><a href="/para-ouvintes">Para ouvintes</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterAL;