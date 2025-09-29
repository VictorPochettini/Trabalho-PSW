// src/components/publicar/DescricaoInput.jsx
import React from 'react';

const DescricaoInput = ({ placeholder = "Escreva sobre sua arte..." }) => {
  return (
    <div className="descricao-container">
      <i className="fa-solid fa-circle-user profile-icon"></i>
      <textarea placeholder={placeholder}></textarea>
    </div>
  );
};

export default DescricaoInput;