// src/components/publicar/DescricaoInput.jsx
import React from "react";

/**
 * Input de descrição controlado.
 * value: string
 * onChange: function(event) -> void
 */
const DescricaoInput = ({ value, onChange, placeholder = "Escreva sobre sua arte..." }) => {
  return (
    <div className="descricao-container">
      <i className="fa-solid fa-circle-user profile-icon" aria-hidden />
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange} // controlado
        rows={6}
        aria-label="Descrição do post"
      />
    </div>
  );
};

export default DescricaoInput;
