// src/components/publicar/EnviarButton.jsx
import React from "react";

const EnviarButton = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      type="button"
      className="enviar-btn"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? "Enviando..." : "Enviar"}
    </button>
  );
};

export default EnviarButton;
