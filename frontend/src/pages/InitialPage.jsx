import React from 'react';
import '../css/InitialPage.css';
import NavbarAL from '../components/NavbarAL';
import FooterAL from '../components/FooterAL';
import VerificaLogin from '../components/VerificaLogin';

const InitialPage = () => {
  return (
    <div className="home-page">
      <VerificaLogin/>
      <NavbarAL />
      
      {/* Hero Section */}
      <section className="hero-artbeat py-5">
        <div className="container-fluid">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Conecte-se com a criatividade musical independente</h1>
              <p className="lead mb-4">Descubra, colabore e apoie artistas talentosos em uma plataforma feita para celebrar a música e a arte em todas as suas formas.</p>
              <div className="hero-buttons">
                <a href="/artistas" className="btn btn-primary btn-lg me-3">Explorar Artistas</a>
                <a href="/desafios" className="btn btn-outline-primary btn-lg">Participar de Desafios</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-artbeat py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold mb-3">Como o ArtBeat funciona</h2>
              <p className="lead">Uma plataforma completa para artistas independentes mostrarem seu trabalho e se conectarem com fãs e outros criadores</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card feature-card-artbeat h-100 text-center p-4">
                <div className="feature-icon fs-1 mb-3">🎵</div>
                <h3 className="h4">Divulgue sua música</h3>
                <p className="text-muted">Compartilhe suas composições autorais e receba feedback direto da comunidade.</p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card feature-card-artbeat h-100 text-center p-4">
                <div className="feature-icon fs-1 mb-3">⭐</div>
                <h3 className="h4">Receba avaliações</h3>
                <p className="text-muted">Seu trabalho é avaliado com estrelas e comentários para ajudar no seu crescimento.</p>
              </div>
            </div>
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

      {/* Challenge Section */}
      <section className="challenge-artbeat py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-8">
              <h2 className="display-5 fw-bold mb-3">Desafio da Semana</h2>
              <p className="lead mb-4">Participe do nosso desafio temático semanal e mostre sua criatividade! Esta semana o tema é "A vida é uma maravilha".</p>
              
              <div className="row justify-content-center mb-4">
                <div className="col-6 col-sm-3 col-lg-2 mb-3">
                  <div className="timer-item-artbeat bg-white rounded p-3">
                    <div className="timer-value fs-2 fw-bold text-primary" id="days">05</div>
                    <div className="timer-label text-muted">Dias</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3 col-lg-2 mb-3">
                  <div className="timer-item-artbeat bg-white rounded p-3">
                    <div className="timer-value fs-2 fw-bold text-primary" id="hours">18</div>
                    <div className="timer-label text-muted">Horas</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3 col-lg-2 mb-3">
                  <div className="timer-item-artbeat bg-white rounded p-3">
                    <div className="timer-value fs-2 fw-bold text-primary" id="minutes">43</div>
                    <div className="timer-label text-muted">Minutos</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3 col-lg-2 mb-3">
                  <div className="timer-item-artbeat bg-white rounded p-3">
                    <div className="timer-value fs-2 fw-bold text-primary" id="seconds">22</div>
                    <div className="timer-label text-muted">Segundos</div>
                  </div>
                </div>
              </div>
              
              <a href="/desafio" className="btn btn-primary btn-lg">Participar do Desafio</a>
            </div>
          </div>
        </div>
      </section>

      {/* Artists Section */}
      <section className="artists-artbeat py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold mb-3">Artistas em Destaque</h2>
              <p className="lead">Conheça alguns dos talentos incríveis que fazem parte da nossa comunidade</p>
            </div>
          </div>
          <div className="row g-4">
            {[
              { icon: '🎸', name: 'Marina Silva', desc: 'Cantora e compositora com foco em MPB e folk contemporâneo.', rating: '4.8', songs: '25' },
              { icon: '🎹', name: 'Pedro Costa', desc: 'Produtor musical especializado em eletrônica e ambient.', rating: '4.9', songs: '18' },
              { icon: '🎤', name: 'Ana & Bia', desc: 'Duo vocal que mistura pop com elementos de música regional.', rating: '4.7', songs: '12' },
              { icon: '🎻', name: 'Rafael Moura', desc: 'Violonista erudito e compositor de trilhas sonoras.', rating: '5.0', songs: '30' }
            ].map((artist, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-3">
                <div className="card artist-card-artbeat h-100 text-center">
                  <div className="card-body p-4">
                    <div className="artist-image fs-1 mb-3">{artist.icon}</div>
                    <h3 className="h5">{artist.name}</h3>
                    <p className="text-muted">{artist.desc}</p>
                    <div className="artist-stats">
                      <span className="badge bg-warning me-2">⭐ {artist.rating}</span>
                      <span className="badge bg-secondary">{artist.songs} músicas</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterAL />
    </div>
  );
};

export default InitialPage;