// src/components/publicar/UploadArea.jsx
import React from "react";

const UploadArea = ({
  tipo = "imagem",
  accept = ".jpg,.png",
  textoPrincipal = "Faça upload da imagem",
  textoSecundario = ".jpg ou .png",
  onFileSelect,
}) => {
  const id = `${tipo}-upload`;

  return (
    <div className="upload-area">
      <input
        type="file"
        id={id}
        hidden
        accept={accept}
        onChange={(e) => onFileSelect(e.target.files[0])} // ✅ Corrigido
      />
      <label htmlFor={id}>
        <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>
        <p className="upload-texto-principal">{textoPrincipal}</p>
        <p className="upload-texto-secundario">{textoSecundario}</p>
      </label>
    </div>
  );
};

export default UploadArea;
