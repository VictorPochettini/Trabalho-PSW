// /mnt/data/PublicarLetra.jsx
/**
 * @fileoverview Página de Publicação de Letra (Post de Texto).
 * @module PublicarLetra
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createPost } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput"; // usado como campo curto (título)
import GeneroSelect from "../components/publicar/GeneroSelect";
import EnviarButton from "../components/publicar/EnviarButton";
import botaoVolta from "../images/botaoVolta.png";
import "../css/publicar.css";
import styles from "../css/Login.module.css";

/**
 * @function BackButton
 * @description Componente de botão que utiliza `useNavigate` para retornar à página anterior no histórico.
 * @returns {JSX.Element} O botão de voltar.
 */
const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => navigate(-1)}
      aria-label="Voltar"
    >
      <img src={botaoVolta} alt="Voltar" />
    </button>
  );
};

/**
 * PublicarLetra — versão sem upload de arquivos.
 * Campos:
 *  - Título curto (input, usa DescricaoInput para manter estilo)
 *  - Letra completa (textarea)
 *  - Gênero (GeneroSelect)
 *
 * Usa createPost (thunk) para fazer requisição ao backend.
 * @function PublicarLetra
 * @description Componente funcional React que permite ao usuário publicar um post de texto (letra de música, poesia, etc.).
 * @returns {JSX.Element} O componente da página PublicarLetra.
 */
const PublicarLetra = () => {
  /** @type {function} Hook do Redux para despachar ações. */
  const dispatch = useDispatch();
  /** @type {function} Hook para navegação programática. */
  const navigate = useNavigate();

  // suporta novo/velho formato de currentUser
  /** @type {object | null} Estado do usuário logado do Redux. */
  const currentUserState = useSelector((s) => s.user?.currentUser);
  /** @type {object | null} Dados consolidados do usuário logado. */
  const currentUser = currentUserState?.user ?? currentUserState ?? null;
  /** @type {string | null} ID do usuário logado. */
  const userId = currentUser?._id ?? currentUser?.id ?? null;
  /** @type {string} Nome de usuário para navegação pós-publicação. */
  const username = currentUser?.username ?? currentUser?.nome ?? "";

  /** @type {[string, function(string): void]} Estado para o título curto da obra. */
  const [tituloCurto, setTituloCurto] = useState("");
  /** @type {[string, function(string): void]} Estado para o conteúdo completo da letra. */
  const [letraCompleta, setLetraCompleta] = useState("");
  /** @type {[string, function(string): void]} Estado para o gênero selecionado. */
  const [genero, setGenero] = useState("");

  /**
   * @async
   * @function handleEnviar
   * @description Lida com o envio do formulário, validando os dados e despachando a action de criação de post.
   */
  const handleEnviar = async () => {
    // validações simples (título + letra + gênero)
    if (!tituloCurto.trim() || !letraCompleta.trim() || !genero) {
      alert("Preencha título, letra e escolha um gênero.");
      return;
    }
    if (!userId) {
      alert("Faça login para publicar.");
      return;
    }

    /** @type {object} Objeto de dados do novo post. */
    const novoPost = {
      titulo: tituloCurto.trim().slice(0, 120),
      conteudo: letraCompleta.trim(),
      tipo: "texto",
      genero,
    };

    try {
      /** @type {object} Resultado da action assíncrona. */
      const res = await dispatch(createPost(novoPost));
      
      if (res.error || res.payload?.error) {
        console.error("createPost returned error:", res.error || res.payload?.error);
        alert("Erro ao enviar o post. Tente novamente.");
        return;
      }

      // sucesso
      alert("Letra publicada com sucesso!");
      setTituloCurto("");
      setLetraCompleta("");
      setGenero("");
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
          {/* Campo curto — título/trecho */}
          <DescricaoInput
            value={tituloCurto}
            onChange={(e) => setTituloCurto(e.target.value)}
            placeholder="Ex.: Refrão - Noite sem fim"
            maxLength={120}
          />

          {/* Campo grande — letra completa */}
          <textarea
            value={letraCompleta}
            onChange={(e) => setLetraCompleta(e.target.value)}
            placeholder="Escreva a letra completa aqui..."
            rows={12}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              resize: "vertical",
              fontFamily: "inherit",
              boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
            }}
          />

          {/* Gênero */}
          <GeneroSelect tipo="texto" value={genero} onChange={setGenero} />

          {/* Botão enviar */}
          <EnviarButton onClick={handleEnviar} />
        </div>
      </PublicarLayout>
    </>
  );
};

export default PublicarLetra;