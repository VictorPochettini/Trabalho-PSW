import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import NavbarAL from '../components/NavbarAL';
import FooterAL from '../components/FooterAL';

const ChallengePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Dados dos desafios principais
  const challenges = [
    {
      title: "Desafio da Semana: A vida é uma maravilha",
      desc: "Crie uma obra que traga esse sentimento à tona.",
      img: "https://imgs.search.brave.com/JIZ1UG3nLySZXXwRcHFuK8aBkiqMkGdz7NewDB1RLTI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ1/MDI2ODU1OC9waG90/by9zdW1tZXItc2Vs/ZmllLmpwZz9zPTYx/Mng2MTImdz0wJms9/MjAmYz1JaXZHUUlY/VjdwQ3VfdHIxMEkw/a2FEb3VVdElpX3BL/ek9ycUJfTkFHb0NB/PQ",
      results: [
        { name: "Luna Beats", img: "https://i.pravatar.cc/300?img=12" },
        { name: "Rafa Groove", img: "https://i.pravatar.cc/300?img=32" },
        { name: "Clara Voz", img: "https://i.pravatar.cc/300?img=45" }
      ]
    },
    {
      title: "Desafio do Mês: Velho Oeste",
      desc: "Crie uma obra que remeta a esse tempo distante e imprevisível.",
      img: "https://imgs.search.brave.com/WFXTTes_LFKGfrjHHcTxe8PqR6Y8j1LTWh4oH5xVYOg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvd2ls/ZC13ZXN0LWJhY2tn/cm91bmQtZTBnbzAw/Ymowa2NsMzNzcS5q/cGc",
      results: [
        { name: "João Letras", img: "https://i.pravatar.cc/300?img=22" },
        { name: "Ana Poesia", img: "https://i.pravatar.cc/300?img=41" },
        { name: "Carlos Conto", img: "https://i.pravatar.cc/300?img=14" }
      ]
    }
  ];

  // Dados dos desafios da comunidade
  const customChallenges = [
    {
      id: 1,
      creator: {
        username: "@musicproducer",
        avatar: "https://i.pravatar.cc/100?img=1"
      },
      title: "Batida Urbana 2024",
      type: "audio",
      timeLeft: "02:15:30",
      participants: 23,
      submissions: [
        {
          id: 1,
          user: {
            username: "@beatmaker1",
            avatar: "https://i.pravatar.cc/80?img=10"
          },
          audioUrl: "/audios/audioPop.mpeg",
          likes: 45,
          liked: false
        },
        {
          id: 2,
          user: {
            username: "@soundcreator",
            avatar: "https://i.pravatar.cc/80?img=15"
          },
          audioUrl: "/audios/audioPop.mpeg",
          likes: 32,
          liked: false
        }
      ]
    },
    {
      id: 2,
      creator: {
        username: "@artdirector",
        avatar: "https://i.pravatar.cc/100?img=5"
      },
      title: "Arte Digital Cyberpunk",
      type: "image",
      timeLeft: "01:42:18",
      participants: 17,
      submissions: [
        {
          id: 3,
          user: {
            username: "@digitalartist",
            avatar: "https://i.pravatar.cc/80?img=20"
          },
          imageUrl: "/images/capa.png",
          likes: 67,
          liked: false
        },
        {
          id: 4,
          user: {
            username: "@pixelmaster",
            avatar: "https://i.pravatar.cc/80?img=25"
          },
          imageUrl: "/images/capa.png",
          likes: 42,
          liked: false
        }
      ]
    }
  ];

  const nextChallenge = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % challenges.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevChallenge = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + challenges.length) % challenges.length);
      setIsTransitioning(false);
    }, 300);
  };

  const currentChallenge = challenges[currentIndex];

  return (
    <div className="desafios-page">
      <NavbarAL/>
      
      {/* Seção Principal de Desafios com Bootstrap Grid */}
      <section className="desafios-hero py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              
              {/* Navegação entre Desafios */}
              <div className="row align-items-center mb-5">
                <div className="col-1 text-start">
                  <button 
                    className="btn btn-outline-primary btn-lg rounded-circle"
                    onClick={prevChallenge}
                    disabled={isTransitioning}
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                </div>
                
                <div className="col-10">
                  <div className="row g-4">
                    
                    {/* Desafio Atual */}
                    <div className="col-12 col-lg-6">
                      <div className={`card desafio-card h-100 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                        <div className="card-body text-center p-4">
                          <h2 className="card-title h3 mb-3">{currentChallenge.title}</h2>
                          <p className="card-text mb-4">{currentChallenge.desc}</p>
                          <img 
                            src={currentChallenge.img} 
                            alt="Imagem do desafio" 
                            className="img-fluid rounded mb-4 desafio-img"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Resultado Anterior */}
                    <div className="col-12 col-lg-6" id="divranking">
                      {/*<div className={`card resultado-card h-100 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>*/}
                        <div className="card-body text-center p-4">
                          <h2 className="card-title h3 mb-4">Resultado do Desafio Anterior</h2>
                          
                          <div className="row g-3 justify-content-center">
                            {currentChallenge.results.map((winner, index) => (
                              <div key={index} className="col-12 col-md-4">
                                <div className="podium-item text-center">
                                  <i className={`fa-solid fa-medal medal ${
                                    index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'
                                  } mb-2`}></i>
                                  <img 
                                    src={winner.img} 
                                    alt={winner.name}
                                    className="rounded-circle mb-2"
                                    width="80"
                                    height="80"
                                  />
                                  <h3 className="h6 mb-2">{winner.name}</h3>
                                  <button className="btn btn-outline-primary btn-sm">
                                    Ver post
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      {/*</div>*/}
                    </div>
                    
                  </div>
                </div>
                
                <div className="col-1 text-end">
                  <button 
                    className="btn btn-outline-primary btn-lg rounded-circle"
                    onClick={nextChallenge}
                    disabled={isTransitioning}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Desafios da Comunidade */}
      <section className="comunidade-desafios py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <h2 className="text-center mb-5 display-5 fw-bold" style={{color: 'var(--artbeat-roxo)'}}>
                Desafios da Comunidade
              </h2>
              
              <div className="row g-4">
                {customChallenges.map((challenge) => (
                  <div key={challenge.id} className="col-12 col-lg-6">
                    <CustomChallengeCard challenge={challenge} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterAL/>
    </div>
  );
};

// Componente para Cartão de Desafio Personalizado
const CustomChallengeCard = ({ challenge }) => {
  const [timeLeft, setTimeLeft] = useState(challenge.timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let [hours, minutes, seconds] = prev.split(':').map(Number);
        
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else {
          clearInterval(timer);
          return "ENCERRADO";
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card h-100 shadow-sm custom-challenge-card">
      {/* Header do Desafio */}
      <div className="card-header custom-challenge-header">
        <div className="row align-items-center text-white">
          <div className="col-8">
            <div className="d-flex align-items-center">
              <img 
                src={challenge.creator.avatar} 
                alt="Creator" 
                className="rounded-circle me-3"
                width="50"
                height="50"
              />
              <div>
                <h6 className="mb-0">{challenge.creator.username}</h6>
                <small className="opacity-75">Criador do desafio</small>
              </div>
            </div>
          </div>
          <div className="col-4 text-end">
            <span className={`badge px-3 py-2 ${
              timeLeft === "ENCERRADO" ? "bg-danger" : "bg-warning text-dark"
            }`}>
              <i className="fas fa-clock me-1"></i>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Botão Participar */}
        <div className="text-center mb-4">
          <button className="btn btn-primary btn-lg w-100 py-3 custom-participate-btn">
            <i className="fas fa-plus me-2"></i>
            Participar do Desafio
          </button>
        </div>

        {/* Informações do Desafio */}
        <div className="row text-center mb-4">
          <div className="col-12">
            <span className="badge bg-info me-2">
              <i className="fas fa-users me-1"></i>
              {challenge.participants} participantes
            </span>
          </div>
        </div>

        {/* Título do Desafio */}
        <h3 className="text-center mb-4 custom-challenge-title">
          {challenge.title}
        </h3>

        {/* Submissões */}
        <div className="submissions-section">
          <h5 className="mb-3">Participações:</h5>
          <div className="row g-3">
            {challenge.submissions.map((submission) => (
              <div key={submission.id} className="col-12">
                {challenge.type === 'audio' ? (
                  <AudioSubmission submission={submission} />
                ) : (
                  <ImageSubmission submission={submission} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para Submissão de Áudio
const AudioSubmission = ({ submission }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [likes, setLikes] = useState(submission.likes);
  const [liked, setLiked] = useState(submission.liked);

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    // Implementar lógica de áudio aqui
  };

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="submission-item p-3 bg-light rounded">
      <div className="row align-items-center">
        <div className="col-auto">
          <img 
            src={submission.user.avatar} 
            alt={submission.user.username}
            className="rounded-circle"
            width="60"
            height="60"
          />
        </div>
        <div className="col">
          <h6 className="mb-2">{submission.user.username}</h6>
          <button 
            className={`btn ${isPlaying ? 'btn-warning' : 'btn-primary'} btn-sm rounded-circle`}
            onClick={toggleAudio}
            style={{width: '40px', height: '40px'}}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
        </div>
        <div className="col-auto">
          <button 
            className={`btn ${liked ? 'btn-danger' : 'btn-outline-danger'} btn-sm`}
            onClick={toggleLike}
          >
            <i className="fas fa-heart me-1"></i>
            {likes}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para Submissão de Imagem
const ImageSubmission = ({ submission }) => {
  const [likes, setLikes] = useState(submission.likes);
  const [liked, setLiked] = useState(submission.liked);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="submission-item p-3 bg-light rounded text-center">
      <img 
        src={submission.imageUrl} 
        alt="Submission" 
        className="img-fluid rounded mb-3 submission-image"
      />
      <h6 className="mb-3">{submission.user.username}</h6>
      <button 
        className={`btn ${liked ? 'btn-danger' : 'btn-outline-danger'} btn-sm`}
        onClick={toggleLike}
      >
        <i className="fas fa-heart me-1"></i>
        {likes}
      </button>
    </div>
  );
};

export default ChallengePage;