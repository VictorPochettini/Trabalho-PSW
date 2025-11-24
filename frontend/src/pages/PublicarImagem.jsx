// src/pages/PublicarImagem.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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

const PublicarImagem = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const posts = useSelector((state) => state.posts.lista || []);

  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? currentUserState ?? null;
  const userId = currentUser?._id ?? currentUser?.id ?? null;
  const username = currentUser?.username ?? currentUser?.nome ?? "";

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const handleEnviar = async () => {
    if (!descricao || !genero || !arquivo) {
      alert("Preencha todos os campos e selecione um arquivo!");
      return;
    }
    if (!userId) {
      alert("Faça login para publicar.");
      return;
    }

    const numericIds = posts.map((p) => Number(p.id)).filter((n) => !Number.isNaN(n));
    const nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1;

    const novoPost = {
      id: String(nextId),
      usuarioId: userId,
      titulo: descricao.trim(),
      conteudo: arquivo.name,
      tipo: "visual",
      genero,
      data: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await dispatch(addPost(novoPost));
      if (res && res.error) {
        console.error("addPost returned error:", res.error);
        alert("Não foi possível enviar a imagem. Tente novamente.");
        return;
      }
      alert("Imagem publicada com sucesso!");
      setDescricao("");
      setGenero("");
      setArquivo(null);
      if (username) navigate(`/user/${username}`);
      else navigate("/");
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
      alert("Não foi possível enviar a imagem. Tente novamente.");
    }
  };

  return (
    <>
      <BackButton />
      <PublicarLayout>
        <div className="container-publicar">
          <DescricaoInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva sua imagem..." />
          <GeneroSelect tipo="visual" value={genero} onChange={setGenero} />
          <UploadArea tipo="image" accept=".png,.jpg,.jpeg,.webp" textoPrincipal="Faça upload da imagem" textoSecundario="PNG / JPG / WEBP" onFileSelect={setArquivo} />
          <EnviarButton onClick={handleEnviar} />
        </div>
      </PublicarLayout>
    </>
  );
};

export default PublicarImagem;
