// Adicione este useEffect ao seu componente FloatingActionButton
import React, { useState, useEffect } from 'react';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      const fabContainer = document.querySelector('.fab-container');
      if (fabContainer && !fabContainer.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="floating-actions">
      <div className={`fab-container ${isOpen ? 'active' : ''}`}>
        <button 
          className={`btn btn-primary rounded-circle fab-main ${isOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isOpen}
        >
          <i className="fas fa-plus" id="fabIcon"></i>
        </button>

        <div className={`fab-menu ${isOpen ? 'open' : ''}`}>
          <a href="PublicarMusica.html" className="fab-sub" title="Publicar Música">
            <i className="fas fa-music"></i> Publicar Música
          </a>
          <a href="PublicarImagem.html" className="fab-sub" title="Publicar Arte">
            <i className="fas fa-image"></i> Publicar Imagem
          </a>
          <a href="PublicarLetra.html" className="fab-sub" title="Publicar Letra">
            <i className="fas fa-feather"></i> Publicar Letra
          </a>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionButton;