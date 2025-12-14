// CreateAccount.jsx
import React, { useState, useEffect } from "react";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

/**
 * Componente simples para renderizar o botão de voltar/link para a página inicial.
 * @returns {JSX.Element} O link do botão de voltar.
 */
const BackButton = () => (
  <Link to="/" className={styles.backButton} aria-label="Voltar para início">
    <img src={botaoVolta} alt="Voltar" />
  </Link>
);

/**
 * Página/Componente para Criação de Nova Conta de Usuário (Registro).
 *
 * Este componente gerencia os campos de entrada (nome, username, email, senha),
 * a lógica de visibilidade da senha, a validação de que as senhas coincidem e
 * a aceitação dos termos de uso. Ele interage com o endpoint de registro
 * da API (`/api/auth/register`) para criar um novo usuário.
 *
 * @returns {JSX.Element} O formulário de criação de conta renderizado.
 */
export default function CriacaoConta() {
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confSenha, setConfSenha] = useState("");
  /** @type {boolean} Controla a visibilidade dos campos de senha. */
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  /** @type {string} Mensagem de erro a ser exibida para o usuário. */
  const [erro, setErro] = useState("");
  /** @type {boolean} Indica se o usuário marcou a caixa de aceitação dos termos. */
  const [aceitouTermos, setAceitouTermos] = useState(false);
  /** @type {boolean} Indica se o formulário está atualmente submetendo dados (para desabilitar o botão). */
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /** @type {boolean} Indica se a Senha e a Confirmação de Senha são iguais e não vazias. */
  const senhasCoincidem = senha !== "" && senha === confSenha;
  /** @type {boolean} Condição final para permitir a submissão do formulário. */
  const podeCriarConta = senhasCoincidem && aceitouTermos;

  /**
   * @private
   * Alterna a visibilidade dos campos de senha (troca entre "text" e "password").
   * @returns {void}
   */
  const toggleSenha = () => setSenhaVisivel((prev) => !prev);

  /**
   * Handler de submissão do formulário.
   *
   * Realiza a validação final (senhas e termos), desabilita o formulário,
   * envia os dados para a API de registro e, em caso de sucesso, redireciona
   * para a página de login. Trata erros de validação do servidor (409/400) ou
   * erros gerais.
   *
   * @async
   * @private
   * @param {React.FormEvent<HTMLFormElement>} e Evento de submissão do formulário.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!senhasCoincidem) {
      setErro("As senhas não coincidem!");
      return;
    }

    if (!aceitouTermos) {
      setErro("Você precisa aceitar os termos para criar a conta.");
      return;
    }

    setLoading(true);
    try {
      // Payload compatível com /api/auth/register (password em vez de 'senha')
      const payload = {
        name: nome,
        username,
        email,
        password: senha,
        // não enviar admin do front por segurança a menos que seu backend permita explicitamente
      };

      // rota recomendada para registro: /api/auth/register
      await axios.post("http://localhost:5000/api/auth/register", payload);

      // Redireciona para login após criação bem-sucedida
      navigate("/login");
    } catch (err) {
      const serverMsg = err.response?.data;
      if (err.response?.status === 409) {
        setErro(serverMsg?.error || "Username ou email já cadastrado.");
      } else if (err.response?.status === 400) {
        const msgs = serverMsg?.messages || serverMsg?.error || serverMsg;
        setErro(Array.isArray(msgs) ? msgs.join(", ") : String(msgs));
      } else {
        setErro("Erro ao cadastrar usuário. Tente novamente.");
      }
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
              <Link to="/termos" className={styles.linkTermos}>
                termos de uso
              </Link>{" "}
              e as{" "}
              <Link to="/politicas" className={styles.linkTermos}>
                políticas de privacidade
              </Link>
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
