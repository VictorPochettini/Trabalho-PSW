// src/components/publicar/UploadArea.jsx
import React from "react";

/**
 * UploadArea
 * props:
 *  - tipo: 'imagem'|'audio' (apenas para id/label)
 *  - accept: string (ex: ".mp3,.wav" ou ".jpg,.png")
 *  - textoPrincipal, textoSecundario: strings
 *  - onFileSelect: function(File) => void
 */
const UploadArea = ({
  tipo = "imagem",
  accept = ".jpg,.png",
  textoPrincipal = "Faça upload da imagem",
  textoSecundario = ".jpg ou .png",
  onFileSelect,
}) => {
  const id = `${tipo}-upload-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="upload-area">
      <input
        id={id}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (typeof onFileSelect === "function") onFileSelect(f);
        }}
        aria-label={`Upload de ${tipo}`}
      />
      <label htmlFor={id} className="upload-label" role="button">
        <i className="fa-solid fa-cloud-arrow-up upload-icon" aria-hidden />
        <p className="upload-texto-principal">{textoPrincipal}</p>
        <p className="upload-texto-secundario">{textoSecundario}</p>
      </label>
    </div>
  );
};

export default UploadArea;
