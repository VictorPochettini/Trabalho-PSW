import React from 'react';
import '../css/InitialPage.css';
import NavbarAL from '../components/NavbarAL';
import FooterAL from '../components/FooterAL';
import VerificaLogin from '../components/VerificaLogin';

/**
 * Componente da página inicial (Landing Page) do aplicativo.
 *
 * Apresenta a proposta de valor, os principais recursos (Divulgação, Avaliações, Apoio)
 * e botões de chamada para ação para explorar o conteúdo.
 *
 * @returns {JSX.Element} A estrutura completa da página inicial.
 */
const InitialPage = () => {
  return (
    <div className="home-page">
      {/* VerificaLogin: Componente que pode ser responsável por checar o status
        de login do usuário ou realizar outras ações iniciais de autenticação. 
      */}
      <VerificaLogin/>
      
      {/* NavbarAL: Componente de navegação (menu principal) da aplicação, 
        provavelmente com links de login/cadastro. 
      */}
      <NavbarAL />
      
      {/* Hero Section - Destaque Principal */}
      <section className="hero-artbeat py-5">
        <div className="container-fluid">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Conecte-se com a criatividade musical independente</h1>
              <p className="lead mb-4">Descubra, colabore e apoie artistas talentosos em uma plataforma feita para celebrar a música e a arte em todas as suas formas.</p>
              <div className="hero-buttons">
                {/* Botões de Chamada para Ação */}
                <a href="/artistas" className="btn btn-primary btn-lg me-3">Explorar Artistas</a>
                <a href="/desafios" className="btn btn-outline-primary btn-lg">Participar de Desafios</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Recursos da Plataforma */}
      <section className="features-artbeat py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold mb-3">Como o ArtBeat funciona</h2>
              <p className="lead">Uma plataforma completa para artistas independentes mostrarem seu trabalho e se conectarem com fãs e outros criadores</p>
            </div>
          </div>
          <div className="row g-4">
            {/* Card de Funcionalidade 1: Divulgação */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card feature-card-artbeat h-100 text-center p-4">
                <div className="feature-icon fs-1 mb-3">🎵</div>
                <h3 className="h4">Divulgue sua música</h3>
                <p className="text-muted">Compartilhe suas composições autorais e receba feedback direto da comunidade.</p>
              </div>
            </div>
            {/* Card de Funcionalidade 2: Avaliações */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card feature-card-artbeat h-100 text-center p-4">
                <div className="feature-icon fs-1 mb-3">⭐</div>
                <h3 className="h4">Receba avaliações</h3>
                <p className="text-muted">Seu trabalho é avaliado com estrelas e comentários para ajudar no seu crescimento.</p>
              </div>
            </div>
            {/* Card de Funcionalidade 3: Apoio/Monetização */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card feature-card-artbeat h-100 text-center p-4">
                <div className="feature-icon fs-1 mb-3">💝</div>
                <h3 className="h4">Receba apoio</h3>
                <p className="text-muted">Permita que seus fãs apoiem seu trabalho com doações a partir de R$ 5,00.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FooterAL: Componente de rodapé. */}
      <FooterAL />
    </div>
  );
};

export default InitialPage;