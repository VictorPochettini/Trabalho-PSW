import React, { useState, useEffect } from "react";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";

export default function CriacaoConta() {
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [senha, setSenha] = useState("");
  const [confSenha, setConfSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

    const senhasCoincidem = senha !== "" && senha === confirmarSenha;
    const podeCriarConta = senhasCoincidem && aceitouTermos;
  

  const toggleSenha = () => {
    setSenhaVisivel((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (senha !== confSenha) {
      setErro("As senhas não coincidem!");
      return;
    }

    setErro(""); // limpa o erro
    console.log("Conta criada com sucesso!");
    // Aqui você pode chamar sua API ou lógica de cadastro
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
      {/* Botão voltar */}
      <a href="javascript:history.back()" className={styles.backButton}>
        <img src={botaoVolta} alt="voltar" />
      </a>

      <div className={styles.container}>
        {/* Logo */}
        <img src={logo} alt="ART BEAT" className={styles.logo} />

        {/* Título */}
        <h1 className={styles.fonteh1}>Criação de Conta</h1>

        {/* Formulário */}
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          {/* Nome */}
          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="nome">
              Nome:
            </label>
            <input
              className={styles.input}
              type="text"
              id="nome"
              name="nome"
              placeholder="João da Silva"
              required
            />
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="email">
              Email:
            </label>
            <input
              className={styles.input}
              type="email"
              id="email"
              name="email"
              placeholder="joaodasilva@gmail.com"
              required
            />
          </div>

          {/* Senha */}
          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="senha">
              Senha:
            </label>
            <div className={styles.inputContainer}>
              <input
                className={styles.input}
                type={senhaVisivel ? "text" : "password"}
                id="senha"
                name="senha"
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

          {/* Confirmar Senha */}
          <div className={styles.formGroup}>
            <label className={styles.fonte} htmlFor="confSenha">
              Confirmação de Senha:
            </label>
            <input
              className={styles.input}
              type="password"
              id="confSenha"
              name="confSenha"
              value={confSenha}
              onChange={(e) => setConfSenha(e.target.value)}
              required
            />
            {/* Mensagem de erro */}
            {erro && <p style={{ color: "red", marginTop: "5px" }}>{erro}</p>}
          </div>

          {/* Termos de uso */}
          <div className={`${styles.formGroup} ${styles.termosContainer}`}>
            <input type="checkbox" id="termos" required />
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

          {/* Botão Criar Conta */}
          <button type="submit" className={styles.entrarbtn}>
            Criar Conta
          </button>
        </form>
      </div>
    </div>
  );
}
