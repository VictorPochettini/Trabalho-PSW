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
  const navigate = useNavigate();
  const posts = useSelector((state) => state.posts.lista || []);

  // suporta novo/velho formato de currentUser
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

    // Observação: aqui assumimos que o upload do arquivo já foi tratado
    // pelo UploadArea (ou que você só salva o nome e faz upload separado).
    const novoPost = {
      id: String(nextId),
      usuarioId: userId,
      titulo: descricao.trim(),
      conteudo: arquivo.name,
      tipo: "musica",
      genero,
      data: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await dispatch(addPost(novoPost));
      // se usas json-server/local slice, o retorno pode não ter payload
      if (res && res.error) {
        console.error("addPost returned error:", res.error);
        alert("Erro ao enviar o post. Tente novamente.");
        return;
      }
      alert("Post enviado com sucesso!");
      setDescricao("");
      setGenero("");
      setArquivo(null);
      if (username) navigate(`/user/${username}`);
      else navigate("/");
    } catch (err) {
      console.error("Erro ao enviar post:", err);
      alert("Erro ao enviar o post. Tente novamente.");
    }
  };

  return (
    <>
      <BackButton />
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
