// src/components/publicar/DescricaoInput.jsx
import React from 'react';

const DescricaoInput = ({ value, onChange, placeholder = "Escreva sobre sua arte..." }) => {
  return (
    <div className="descricao-container">
      <i className="fa-solid fa-circle-user profile-icon"></i>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange} // ✅ Agora controlado corretamente
      />
    </div>
  );
};

export default DescricaoInput;
