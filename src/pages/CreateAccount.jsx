import React, { useState, useEffect } from "react";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Componente BackButton
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

export default function CriacaoConta() {
  const [usuarios, setUsuarios] = useState([]);
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confSenha, setConfSenha] = useState("");
  const estrelas = 0;
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const senhasCoincidem = senha !== "" && senha === confSenha;
  const podeCriarConta = senhasCoincidem && aceitouTermos;

  const toggleSenha = () => setSenhaVisivel((prev) => !prev);

  useEffect(() => {
    axios.get("http://localhost:5000/usuarios")
      .then(res => setUsuarios(res.data))
      .catch(err => console.error(err));
  }, []);

  const id = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!senhasCoincidem) {
      setErro("As senhas não coincidem!");
      return;
    }

    setLoading(true);
    try {
      // Verifica duplicidade
      const res = await axios.get("http://localhost:5000/usuarios");
      const usuarios = res.data;

      if (usuarios.some((u) => u.username === username)) {
        throw new Error("Username já existe!");
      }
      if (usuarios.some((u) => u.email === email)) {
        throw new Error("Email já cadastrado!");
      }

      // Cria novo usuário
      await axios.post("http://localhost:5000/usuarios", {
        id,
        nome,
        username,
        email,
        senha,
        estrelas,
      });

      // Redireciona para login ou limpa form
      navigate("/login");
    } catch (err) {
      setErro(err.message || "Erro ao cadastrar usuário!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (senha && confSenha && senha !== confSenha) {
      setErro("As senhas não coincidem!");
    } else {
      setErro("");
    }
  }, [senha, confSenha]);

  return (
    <div className={styles.loginPage}>
      <BackButton />

      <div className={styles.container}>
        <img src={logo} alt="ART BEAT" className={styles.logo} />

        <h1 className={styles.fonteh1}>Criação de Conta</h1>

        <form className={styles.formContainer} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="nome">Nome:</label>
            <input
              className={styles.input}
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="João da Silva"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="username">Username:</label>
            <input
              className={styles.input}
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="joao_da_silva"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="email">Email:</label>
            <input
              className={styles.input}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joaodasilva@gmail.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="senha">Senha:</label>
            <div className={styles.inputContainer}>
              <input
                className={`${styles.input} ${erro ? styles.inputErro : ""}`}
                type={senhaVisivel ? "text" : "password"}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <img
                src={senhaVisivel ? olhoAberto : olhoFechado}
                alt="visualizar senha"
                className={styles.eyeIcon}
                onClick={toggleSenha}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="confSenha">
              Confirmação de Senha:
            </label>
            <input
              className={`${styles.input} ${erro ? styles.inputErro : ""}`}
              type="password"
              id="confSenha"
              value={confSenha}
              onChange={(e) => setConfSenha(e.target.value)}
              required
            />
            {erro && <span className={styles.inputErrorMsg}>{erro}</span>}
          </div>

          <div className={`${styles.formGroup} ${styles.termosContainer}`}>
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className={styles.termosCheckbox}
              required
            />
            <label className={styles.termos} htmlFor="termos">
              Eu aceito os{" "}
              <a className={styles.refs} href="TermosDeUso.html">
                termos de uso
              </a>{" "}
              e{" "}
              <a className={styles.refs} href="PoliticasDePrivacidade.html">
                políticas de privacidade
              </a>
            </label>
          </div>

          <button
            type="submit"
            className={`${styles.entrarbtn} ${
              !podeCriarConta || loading ? styles.desabilitado : ""
            }`}
            disabled={!podeCriarConta || loading}
          >
            {loading ? "Cadastrando..." : "Criar Conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
