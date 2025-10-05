// src/pages/PublicarImagem.jsx
import React from 'react';
import DescricaoInput from '../components/publicar/DescricaoInput';
import GeneroSelect from '../components/publicar/GeneroSelect';
import UploadArea from '../components/publicar/UploadArea';
import EnviarButton from '../components/publicar/EnviarButton';
import '../css/publicar.css';
import PublicarLayout from '../components/layout/PublicarLayout';

const PublicarImagem = () => {
  const handleEnviar = () => {
    // Lógica para enviar a imagem
    console.log('Enviando imagem...');
  };

  return (
    <PublicarLayout>
    <div className="container-publicar">
      <DescricaoInput placeholder="Escreva sobre sua arte..." />
      <GeneroSelect tipo="arte" />
      <UploadArea 
        tipo="imagem"
        accept=".jpg,.png"
        textoPrincipal="Faça upload da imagem"
        textoSecundario=".jpg ou .png"
      />
      <EnviarButton onClick={handleEnviar} />
    </div>
    </PublicarLayout>
  );
};

export default PublicarImagem;