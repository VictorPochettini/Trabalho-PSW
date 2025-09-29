import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
          className={`btn btn-primary fab-main ${isOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isOpen}
        >
          <i className="fas fa-plus"></i>
        </button>

        <div className={`fab-menu ${isOpen ? 'open' : ''}`}>
          <Link to="/publicar-musica" className="fab-sub" title="Publicar Música">
            <i className="fas fa-music"></i>
            <span>Música</span>
          </Link>
          <Link to="/publicar-imagem" className="fab-sub" title="Publicar Arte">
            <i className="fas fa-image"></i>
            <span>Imagem</span>
          </Link>
          <Link to="/publicar-letra" className="fab-sub" title="Publicar Letra">
            <i className="fas fa-feather"></i>
            <span>Letra</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionButton;