// src/pages/DiscoverArtist.jsx
import React, { useState } from 'react';
import Header from '../components/Header2';

const DiscoverArtist = () => {
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);

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
    setIsRouletteSpinning(true);
    setCurrentArtist(null);

    setTimeout(() => {
      const list = artists[category];
      const randomArtist = list[Math.floor(Math.random() * list.length)];
      setCurrentArtist(randomArtist);
      setIsRouletteSpinning(false);
    }, 1500);
  };

  return (
    <>
      <Header />
      
      <div className="container mt-5 pt-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <h1 className="display-5 fw-bold gradient-text mb-4">
              Descubra um Artista
            </h1>
            
            <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
              <button 
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('musica')}
              >
                <i className="fa-solid fa-music me-2"></i> Música
              </button>
              <button 
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('texto')}
              >
                <i className="fa-solid fa-pen-nib me-2"></i> Texto
              </button>
              <button 
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('visual')}
              >
                <i className="fas fa-image"></i> Visual
              </button>
            </div>

            {isRouletteSpinning && (
              <div className="roulette text-primary mb-4">
                🎲 Sorteando artista...
              </div>
            )}

            {currentArtist && (
              <div className="artist-card mx-auto p-4">
                <img 
                  src={currentArtist.img} 
                  alt={currentArtist.name}
                  className="artist-img mb-3"
                />
                <h2 className="artist-name mb-2">{currentArtist.name}</h2>
                <p className="artist-bio mb-3">{currentArtist.bio}</p>
                <button className="btn follow-btn px-4">
                  Seguir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .gradient-text {
          background: linear-gradient(90deg, #5e17eb, #1d147c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cat-btn {
          border-radius: 40px;
          background: linear-gradient(135deg, #5e17eb, #1d147c);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: none;
          transition: all 0.3s;
        }

        .cat-btn:hover {
          background: linear-gradient(135deg, #7f39fb, #3726a5);
          transform: scale(1.05);
          color: white;
        }

        .artist-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: saturate(180%) blur(10px);
          -webkit-backdrop-filter: saturate(180%) blur(10px);
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.05);
          border-radius: 20px;
          width: 100%;
          max-width: 350px;
          text-align: center;
          padding: 25px;
          animation: fadeIn 0.6s ease forwards;
        }

        .artist-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid #5e17eb;
        }

        .artist-name {
          font-size: 1.5rem;
          color: #1d147c;
          font-weight: 600;
        }

        .artist-bio {
          color: #555;
          font-size: 0.95rem;
        }

        .follow-btn {
          border-radius: 30px;
          background: linear-gradient(135deg, #5e17eb, #1d147c);
          color: white;
          font-weight: 600;
          border: none;
          transition: all 0.3s;
        }

        .follow-btn:hover {
          background: linear-gradient(135deg, #7f39fb, #3726a5);
          transform: translateY(-2px);
          color: white;
        }

        .roulette {
          font-size: 1.2rem;
          font-weight: bold;
          animation: blink 0.3s infinite alternate;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default DiscoverArtist;