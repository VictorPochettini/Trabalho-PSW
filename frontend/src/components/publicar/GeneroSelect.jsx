// src/components/publicar/GeneroSelect.jsx
import React from 'react';

const GeneroSelect = ({ tipo = "arte", value, onChange }) => {
  const opcoesArte = [
    { value: "ilustracao-digital", label: "Ilustração digital" },
    { value: "ilustracao-manual", label: "Ilustração manual" },
    { value: "minimalismo", label: "Minimalismo" },
    { value: "arte_grafica", label: "Arte gráfica" },
    { value: "surrealismo", label: "Surrealismo" },
    { value: "pop-art", label: "Pop-art" }
  ];

  const opcoesMusica = [
    { value: "eletronica", label: "Eletrônica" },
    { value: "funk", label: "Funk" },
    { value: "kpop", label: "K-pop" },
    { value: "mpb", label: "MPB" },
    { value: "pagode", label: "Pagode" },
    { value: "pop", label: "Pop" },
    { value: "rnb", label: "R&B" },
    { value: "reggae", label: "Reggae" },
    { value: "rock", label: "Rock" },
    { value: "sertanejo", label: "Sertanejo" },
    { value: "trap", label: "Trap" }
  ];

  const opcoesTexto = [
    { value: "letra", label: "Letra" },
    { value: "poema", label: "Poema"},
    { value: "historia", label: "História"}
  ];

  const opcoes = tipo === "musica" ? opcoesMusica : tipo==="texto" ? opcoesTexto : opcoesArte;
  const placeholder = tipo === "arte" ? "Estilo de Arte" : "Gênero";

  return (
    <div className="genero-container">
      <select
        className="genero-select"
        value={value}
        onChange={(e) => onChange(e.target.value)} // ✅ Agora envia apenas o valor
      >
        <option value="" disabled>{placeholder}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GeneroSelect;
