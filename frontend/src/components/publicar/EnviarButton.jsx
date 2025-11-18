// src/components/publicar/EnviarButton.jsx
import React from 'react';

const EnviarButton = ({ onClick }) => {
  return (
    <button className="enviar-btn" onClick={onClick}>
      Enviar
    </button>
  );
};

export default EnviarButton;