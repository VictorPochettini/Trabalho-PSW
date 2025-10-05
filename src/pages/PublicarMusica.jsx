// src/pages/PublicarMusica.jsx
import React from 'react';
import DescricaoInput from '../components/publicar/DescricaoInput';
import GeneroSelect from '../components/publicar/GeneroSelect';
import UploadArea from '../components/publicar/UploadArea';
import EnviarButton from '../components/publicar/EnviarButton';
import '../css/publicar.css';
import PublicarLayout from '../components/layout/PublicarLayout';

const PublicarMusica = () => {
  const handleEnviar = () => {
    // Lógica para enviar a música
    console.log('Enviando música...');
  };

  return (
    <PublicarLayout>
    <div className="container-publicar">
      <DescricaoInput placeholder="Escreva sobre sua música..." />
      <GeneroSelect tipo="musica" />
      <UploadArea 
        tipo="audio"
        accept=".mp3,.wav"
        textoPrincipal="Faça upload do arquivo de áudio"
        textoSecundario=".mp3 ou .wav"
      />
      <EnviarButton onClick={handleEnviar} />
    </div>
    </PublicarLayout>
  );
};

export default PublicarMusica;