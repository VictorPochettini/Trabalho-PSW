// src/pages/PublicarMusica.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput";
import GeneroSelect from "../components/publicar/GeneroSelect";
import UploadArea from "../components/publicar/UploadArea";
import EnviarButton from "../components/publicar/EnviarButton";
import botaoVolta from "../images/botaoVolta.png";
import "../css/publicar.css";
import styles from "../css/Login.module.css";

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => navigate(-1)}
    >
      <img src={botaoVolta} alt="Voltar" />
    </button>
  );
};

const PublicarMusica = () => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.lista);
  const currentUser = useSelector((state) => state.user.currentUser);

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const handleEnviar = async () => {
    if (!descricao || !genero || !arquivo) {
      alert("Preencha todos os campos e selecione um arquivo!");
      return;
    }

    const novoPost = {
      id: (posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1).toString(),
      usuarioId: currentUser.id,
      titulo: descricao,
      conteudo: arquivo.name,
      tipo: "musica",
      genero,
      data: new Date().toISOString(),
    };

    try {
      await dispatch(addPost(novoPost)).unwrap();
      alert("Post enviado com sucesso!");
      setDescricao("");
      setGenero("");
      setArquivo(null);
    } catch (err) {
      alert("Erro ao enviar o post: " + err.message);
    }
  };

  return (
    <>
    <BackButton/>
    <PublicarLayout>
      <div className="container-publicar">
        <DescricaoInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Escreva sobre sua música..." />
        <GeneroSelect tipo="musica" value={genero} onChange={setGenero} />
        <UploadArea tipo="audio" accept=".mp3,.wav" textoPrincipal="Faça upload do arquivo de áudio" textoSecundario=".mp3 ou .wav" onFileSelect={setArquivo} />
        <EnviarButton onClick={handleEnviar} />
      </div>
    </PublicarLayout>
    </>
  );
};

export default PublicarMusica;
