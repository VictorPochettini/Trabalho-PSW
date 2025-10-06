import React, { useState, useEffect } from "react";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";
import { useNavigate } from "react-router-dom";

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

export default function Login() {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const alternarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  useEffect(() => {
    // Adiciona classe ao body para garantir overflow hidden
    document.body.classList.add(styles.loginBody);

    // Remove quando sair da página
    return () => {
      document.body.classList.remove(styles.loginBody);
    };
  }, []);

  return (
    <div className={styles.pagefe}>
      <div className={styles.loginPage}>
        {/* Botão voltar */}
        <BackButton />

        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <img src={logo} alt="ART BEAT" className={styles.logo} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 className={styles.fonteh1}>Entrar Na Conta</h1>
          </div>

          <form className={styles.formContainer}>
            {/* Usuário */}
            <div className={styles.formGroup}>
              <label className={styles.fonte} htmlFor="usuario">
                Usuário:
              </label>
              <input
                className={styles.input}
                type="text"
                id="usuario"
                name="username"
                required
                placeholder="Digite seu usuário"
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
                  type={mostrarSenha ? "text" : "password"}
                  id="senha"
                  name="senha"
                  required
                  placeholder="Digite sua senha"
                />
                <img
                  className={styles.eyeIcon}
                  src={mostrarSenha ? olhoAberto : olhoFechado}
                  alt="visualizar senha"
                  onClick={alternarSenha}
                />
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" className={styles.entrarbtn}>
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
