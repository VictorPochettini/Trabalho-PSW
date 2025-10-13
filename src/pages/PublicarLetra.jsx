// src/pages/PublicarLetra.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput";
import GeneroSelect from "../components/publicar/GeneroSelect";
import EnviarButton from "../components/publicar/EnviarButton";
import "../css/publicar.css";

const PublicarLetra = () => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.lista);
  const currentUser = useSelector((state) => state.user.currentUser);

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");

  const handleEnviar = async () => {
    if (!descricao || !genero) {
      alert("Preencha todos os campos!");
      return;
    }

    const novoPost = {
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      usuarioId: currentUser.id,
      titulo: descricao.slice(0, 20),
      conteudo: descricao,
      tipo: "texto",
      genero,
      data: new Date().toISOString(),
    };

    try {
      await dispatch(addPost(novoPost)).unwrap();
      alert("Post enviado com sucesso!");
      setDescricao("");
      setGenero("");
    } catch (err) {
      alert("Erro ao enviar o post: " + err.message);
    }
  };

  return (
    <PublicarLayout>
      <div className="container-publicar">
        <DescricaoInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Escreva sobre sua música..." />
        <GeneroSelect tipo="musica" value={genero} onChange={setGenero} />
        <EnviarButton onClick={handleEnviar} />
      </div>
    </PublicarLayout>
  );
};

export default PublicarLetra;
