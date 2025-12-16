/**
 * @fileoverview Componente de rodapé da aplicação ArtBeat
 * @module FooterAL
 * @description 
 * Componente de rodapé que exibe informações da plataforma, links rápidos
 * e direitos autorais. Projetado para ser usado em todas as páginas do site.
 */

import React from 'react';
//import '../css/FooterAL.css';

/**
 * Componente de rodapé da aplicação ArtBeat
 * @component
 * @returns {JSX.Element} Componente de rodapé estilizado
 * 
 * @example
 * // Exemplo de uso
 * <FooterAL />
 * 
 * @description
 * Este componente inclui:
 * - Logo e descrição da plataforma
 * - Links rápidos para navegação
 * - Informações de direitos autorais
 */
const FooterAL = () => {
  return (
    <footer className="artbeat-footer" role="contentinfo" aria-label="Rodapé do site">
      <div className="container">
        <div className="footer-content">
          <div className="footer-column me-3">
            <h3>ArtBeat</h3>
            <p>Conectando artistas independentes e amantes da música<br/> em uma plataforma colaborativa e inovadora.</p>
          </div>
          <div className="footer-column">
            <h3>Links Rápidos</h3>
            <ul>
              <li><a href="/" aria-label="Ir para a página inicial">Início</a></li>
              <li><a href="/artistas" aria-label="Ver artistas">Artistas</a></li>
              <li><a href="/desafios" aria-label="Ver desafios">Desafios</a></li>
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