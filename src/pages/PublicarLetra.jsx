// src/pages/PublicarLetra.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addPost  } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput";
import GeneroSelect from "../components/publicar/GeneroSelect";
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

const PublicarLetra = () => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.lista);
  const currentUser = useSelector((state) => state.user.currentUser);

  // ⬇️ agora separados
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [genero, setGenero] = useState("");

  const handleEnviar = async () => {
    if (!titulo.trim() || !conteudo.trim() || !genero) {
      alert("Preencha título, conteúdo e gênero!");
      return;
    }

    const novoPost = {
      id: (posts.length > 0 ? Math.max(...posts.map((p) => Number(p.id))) + 1 : 1).toString(),
      usuarioId: currentUser.id,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      tipo: "texto",            // conforme seu DB
      genero,
      data: new Date().toISOString(),
    };

    try {
      await dispatch(addPost(novoPost)).unwrap();
      alert("Post enviado com sucesso!");
      setTitulo("");
      setConteudo("");
      setGenero("");
    } catch (err) {
      alert("Erro ao enviar o post: " + err.message);
    }
  };

  return (
    <>
      <BackButton />
      <PublicarLayout>
        <div className="container-publicar">
          {/* Campo de Título (linha única) */}
          <input
            type="text"
            className="publicar-input titulo-input"
            placeholder="Descrição do texto..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
          />

          {/* Campo de Conteúdo (usa seu componente de descrição) */}
          <DescricaoInput
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Escreva o conteúdo da sua letra..."
          />

          {/* Gênero — se seu GeneroSelect usa 'tipo', passe 'texto'/'letra' */}
          <GeneroSelect tipo="texto" value={genero} onChange={setGenero} />

          <EnviarButton onClick={handleEnviar} />
        </div>
      </PublicarLayout>

      {/* estilos mínimos para o input de título, se precisar */}
      <style>{`
        .container-publicar {
          display: grid;
          gap: 12px;
        }
        .publicar-input.titulo-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
          color: #fff;
          outline: none;
        }
        .publicar-input.titulo-input::placeholder {
          color: rgba(255,255,255,0.7);
        }
        .publicar-input.titulo-input:focus {
          border-color: rgba(255,255,255,0.28);
          box-shadow: 0 0 0 3px rgba(94,23,235,0.25);
        }
      `}</style>
    </>
  );
};

export default PublicarLetra;
