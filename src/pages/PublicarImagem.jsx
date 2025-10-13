// src/pages/PublicarImagem.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput";
import GeneroSelect from "../components/publicar/GeneroSelect";
import UploadArea from "../components/publicar/UploadArea";
import EnviarButton from "../components/publicar/EnviarButton";
import "../css/publicar.css";

const PublicarImagem = () => {
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
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      usuarioId: currentUser.id,
      titulo: descricao.slice(0, 20),
      conteudo: arquivo.name,
      tipo: "visual",
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
    <PublicarLayout>
      <div className="container-publicar">
        <DescricaoInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Escreva sobre sua arte..." />
        <GeneroSelect tipo="arte" value={genero} onChange={setGenero} />
        <UploadArea tipo="imagem" accept=".jpg,.png" textoPrincipal="Faça upload da imagem" textoSecundario=".jpg ou .png" onFileSelect={setArquivo} />
        <EnviarButton onClick={handleEnviar} />
      </div>
    </PublicarLayout>
  );
};

export default PublicarImagem;
