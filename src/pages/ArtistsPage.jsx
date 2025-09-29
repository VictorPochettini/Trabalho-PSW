import React from 'react';
import '../css/InitialPage.css';
import NavbarAL from '../components/NavbarAL';
import FooterAL from '../components/FooterAL';

const ArtistsPage = () => {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const artists = {
    musica: [
      { name: "Luna Beats", bio: "Produtora indie focada em lo-fi e chillwave.", img: "https://i.pravatar.cc/300?img=23" },
      { name: "Rafa Groove", bio: "Músico experimental misturando jazz e eletrônica.", img: "https://i.pravatar.cc/300?img=51" },
      { name: "Clara Voz", bio: "Cantora de MPB com influências modernas.", img: "https://i.pravatar.cc/300?img=45" }
    ],
    texto: [
      { name: "João Letras", bio: "Escreve crônicas urbanas com linguagem poética.", img: "https://i.pravatar.cc/300?img=59" },
      { name: "Ana Poesia", bio: "Autora de poemas contemporâneos e minimalistas.", img: "https://i.pravatar.cc/300?img=41" },
      { name: "Carlos Conto", bio: "Contista com foco em realismo mágico.", img: "https://i.pravatar.cc/300?img=14" }
    ],
    visual: [
      { name: "Mia Art", bio: "Ilustradora digital apaixonada por cores vibrantes.", img: "https://i.pravatar.cc/300?img=5" },
      { name: "Leo Sketch", bio: "Artista de rua trazendo o grafite para o digital.", img: "https://i.pravatar.cc/300?img=11" },
      { name: "Sofia Canvas", bio: "Pintora abstrata explorando formas geométricas.", img: "https://i.pravatar.cc/300?img=38" }
    ]
  };

  const getRandomArtist = (category) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const list = artists[category];
      const random = list[Math.floor(Math.random() * list.length)];
      setSelectedArtist(random);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="artistas-page">
      <Navbar />
      
      {/* Hero Section com Bootstrap Grid */}
      <section className="hero-artistas py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-8">
              <h1 className="display-4 fw-bold mb-4">Descubra um Artista</h1>
              <p className="lead mb-5">
                Explore novos talentos em música, textos e artes visuais. Clique em uma categoria e deixe o destino
                escolher quem você vai conhecer hoje.
              </p>

              {/* Categorias com Grid */}
              <div className="row justify-content-center g-3 mb-5">
                <div className="col-12 col-sm-6 col-md-4">
                  <button 
                    className="btn btn-primary btn-lg w-100 h-100 py-3"
                    onClick={() => getRandomArtist('musica')}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-music me-2"></i>
                    Música
                  </button>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <button 
                    className="btn btn-primary btn-lg w-100 h-100 py-3"
                    onClick={() => getRandomArtist('texto')}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-pen-nib me-2"></i>
                    Texto
                  </button>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <button 
                    className="btn btn-primary btn-lg w-100 h-100 py-3"
                    onClick={() => getRandomArtist('visual')}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-paintbrush me-2"></i>
                    Visual
                  </button>
                </div>
              </div>

              {/* Roleta Sorteando */}
              {isLoading && (
                <div className="row justify-content-center mb-4">
                  <div className="col-12 col-md-6">
                    <div className="alert alert-info text-center py-3">
                      <i className="fa-solid fa-dice me-2"></i>
                      🎲 Sorteando artista...
                    </div>
                  </div>
                </div>
              )}

              {/* Card do Artista com Grid */}
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                  <div className="card artist-card-artbeat text-center p-4">
                    {!selectedArtist ? (
                      <div className="artist-placeholder">
                        <i className="fa-solid fa-user-circle artist-placeholder-icon"></i>
                        <h2 className="h4 mt-3">Artista</h2>
                        <p className="text-muted">Perfil a ser sorteado...</p>
                        <button className="btn btn-outline-primary" disabled>
                          Seguir
                        </button>
                      </div>
                    ) : (
                      <div className="artist-result">
                        <img 
                          src={selectedArtist.img} 
                          alt={`Foto de ${selectedArtist.name}`}
                          className="artist-img rounded-circle mb-3"
                        />
                        <h2 className="h4">{selectedArtist.name}</h2>
                        <p className="text-muted mb-3">{selectedArtist.bio}</p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => window.location.href = '/login'}
                        >
                          Seguir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArtistsPage;