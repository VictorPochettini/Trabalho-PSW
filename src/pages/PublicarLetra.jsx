// src/pages/PublicarLetra.jsx
import React from 'react';
import DescricaoInput from '../components/publicar/DescricaoInput';
import GeneroSelect from '../components/publicar/GeneroSelect';
import EnviarButton from '../components/publicar/EnviarButton';
import '../css/publicar.css';
import PublicarLayout from '../components/layout/PublicarLayout';

const PublicarLetra = () => {
  const handleEnviar = () => {
    // Lógica para enviar a letra
    console.log('Enviando letra...');
  };

  return (
    <PublicarLayout>
    <div className="container-publicar">
      <DescricaoInput placeholder="Escreva sobre sua música..." />
      <GeneroSelect tipo="musica" />
      <EnviarButton onClick={handleEnviar} />
    </div>
    </PublicarLayout>
  );
};

export default PublicarLetra;