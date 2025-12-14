// src/pages/ParticipatePage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import HeaderForYou from "../components/Header2";
import { fetchDesafioById, selectDesafioById } from "../redux/desafiosSlice";
import { fetchPostsByUser } from "../redux/postsSlice";
import { createParticipacao } from "../redux/participacoesSlice";

/**
 * @typedef {object} Desafio
 * @property {string} id ID único do desafio (parâmetro de rota).
 * @property {string} [_id] ID único do desafio (alternativo).
 * @property {string} titulo Título do desafio.
 * @property {string} descricao Descrição breve.
 * @property {string | object} [dataInicio] Data de início do desafio (pode vir em vários formatos).
 * @property {('musica' | 'visual' | 'texto')[]} [tipoAceito] Tipos de posts permitidos (prioritário).
 * @property {('musica' | 'visual' | 'texto')[]} [tiposPermitidos] Tipos de posts permitidos (fallback).
 */

/**
 * @typedef {object} Post
 * @property {string} [_id] ID do MongoDB do post.
 * @property {string} [id] ID alternativo do post.
 * @property {string} [titulo] Título do post.
 * @property {('musica' | 'visual' | 'texto')} [tipo] Tipo de conteúdo do post.
 * @property {string | object} [data] Data de criação do post.
 * @property {string | object} [createdAt] Data de criação do post (fallback).
 * @property {number} [ratingAvg] Média de avaliação.
 * @property {number} [ratingCount] Contagem de avaliações.
 * @property {number} [commentCount] Contagem de comentários.
 */

/**
 * @typedef {object} ParticipacaoPayload
 * @property {string} desafioId O ID do desafio.
 * @property {string} postId O ID do post selecionado.
 * @property {string} usuarioId O ID do usuário participante.
 */

/**
 * Componente da página de participação em desafios.
 * Permite ao usuário logado selecionar um de seus posts elegíveis para submissão
 * em um desafio específico.
 *
 * @returns {JSX.Element} A interface de seleção e submissão de posts.
 */
function ParticipatePage() {
  const { id } = useParams(); // ID do desafio da URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Redux State ---
  /** @type {CurrentUser | null} Objeto do usuário logado. */
  const currentUser = useSelector((s) => s.user?.currentUser?.user) ?? null;
  /** @type {string | null} ID do usuário logado. */
  const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;

  /** @type {Desafio | undefined} O objeto desafio carregado. */
  const desafio = useSelector(selectDesafioById(id));
  /** @type {Post[]} Posts do usuário logado. */
  const userPosts = useSelector((s) => s.posts?.byUser?.[currentUserId] || []);
  /** @type {boolean} Status de carregamento da submissão de participação. */
  const loading = useSelector((s) => s.participacoes?.loading);

  // --- Local State ---
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} O ID do post selecionado para participação. */
  const [selectedPostId, setSelectedPostId] = useState("");
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Mensagem de erro para a interface. */
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      dispatch(fetchDesafioById(id));
    }
    if (currentUserId) {
      dispatch(fetchPostsByUser(currentUserId));
    }
  }, [dispatch, id, currentUserId]);

  // ✅ DEBUG: Log para verificar dados
  useEffect(() => {
    console.log('🔍 DEBUG - Desafio completo:', desafio);
    console.log('🔍 DEBUG - Posts do usuário:', userPosts);
  }, [desafio, userPosts]);

  /**
   * @private
   * Normaliza os tipos de posts aceitos pelo desafio, priorizando `tipoAceito` e
   * usando `tiposPermitidos` como fallback.
   * @returns {string[]} Lista de tipos aceitos em minúsculas (ex: ['musica', 'visual']).
   */
  const getTiposAceitos = () => {
    if (!desafio) {
      console.log('⚠️ Desafio não carregado ainda');
      return [];
    }
    
    // ✅ PRIORIDADE 1: Campo tipoAceito (novo)
    if (desafio.tipoAceito && Array.isArray(desafio.tipoAceito) && desafio.tipoAceito.length > 0) {
      console.log('✅ Usando campo tipoAceito:', desafio.tipoAceito);
      return desafio.tipoAceito.map(t => t.toLowerCase().trim());
    }
    
    // ✅ PRIORIDADE 2: Campo tiposPermitidos (compatibilidade)
    if (desafio.tiposPermitidos && Array.isArray(desafio.tiposPermitidos) && desafio.tiposPermitidos.length > 0) {
      console.log('✅ Usando campo tiposPermitidos (fallback):', desafio.tiposPermitidos);
      return desafio.tiposPermitidos.map(t => t.toLowerCase().trim());
    }
    
    // ✅ FALLBACK: Se não tem nenhum campo, aceitar todos os tipos
    console.log('⚠️ Desafio SEM tipoAceito ou tiposPermitidos - aceitando todos os tipos');
    return ['musica', 'visual', 'texto'];
  };

  /**
   * @private
   * Função robusta para converter dados de data que podem vir em múltiplos formatos
   * (string ISO, timestamp numérico, objeto do MongoDB: {$date: ...}) para um objeto Date nativo.
   * @param {any} dataObj A data em seu formato raw.
   * @returns {Date | null} O objeto Date ou null se a conversão falhar.
   */
  const parseDataMongoDB = (dataObj) => {
    if (!dataObj) {
      console.log('⚠️ Data não fornecida');
      return null;
    }
    
    console.log('🔍 Objeto de data recebido:', dataObj, typeof dataObj);
    
    try {
      // Se é objeto Date do MongoDB: {$date: {$numberLong: "1765324800000"}}
      if (dataObj.$date) {
        const timestamp = dataObj.$date.$numberLong || dataObj.$date;
        const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        const data = new Date(timestampNum);
        console.log('✅ Data convertida de MongoDB object:', data.toISOString());
        return data;
      }
      
      // ✅ NOVO: Se é número grande (timestamp em milissegundos)
      if (typeof dataObj === 'number' && dataObj > 1000000000) {
        const data = new Date(dataObj);
        console.log('✅ Data convertida de timestamp numérico:', data.toISOString());
        return data;
      }
      
      // ✅ NOVO: Se é string que parece timestamp
      if (typeof dataObj === 'string') {
        // Tentar como timestamp
        const timestampNum = parseInt(dataObj);
        if (!isNaN(timestampNum) && timestampNum > 1000000000) {
          const data = new Date(timestampNum);
          console.log('✅ Data convertida de string timestamp:', data.toISOString());
          return data;
        }
        
        // Tentar como ISO string
        const data = new Date(dataObj);
        if (!isNaN(data.getTime())) {
          console.log('✅ Data convertida de string ISO:', data.toISOString());
          return data;
        }
      }
      
      // Se já é objeto Date
      if (dataObj instanceof Date) {
        console.log('✅ Já é objeto Date:', dataObj.toISOString());
        return dataObj;
      }
      
      // ✅ FALLBACK: Tentar conversão direta
      const data = new Date(dataObj);
      if (!isNaN(data.getTime())) {
        console.log('✅ Data convertida (fallback):', data.toISOString());
        return data;
      }
      
      console.error('❌ Não foi possível converter data:', dataObj);
      return null;
    } catch (e) {
      console.error('❌ Erro ao converter data:', e);
      return null;
    }
  };

  /**
   * @private
   * A lista final de posts do usuário que são considerados elegíveis para o desafio,
   * aplicando filtros de tipo e data de criação.
   *
   * @type {Post[]}
   */
  const postsElegiveis = userPosts.filter((post) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Verificando post:', post.titulo || post._id);
    console.log('📄 Post completo:', post);
    
    const tiposAceitos = getTiposAceitos();
    console.log('📋 Tipos aceitos pelo desafio:', tiposAceitos);
    
    // 1. Verificar tipo permitido (apenas se desafio tem tipos específicos)
    const tipoPost = (post.tipo || '').toLowerCase().trim();
    console.log(`  📌 Tipo do post: "${tipoPost}"`);
    
    const tipoPermitido = tiposAceitos.includes(tipoPost);
    console.log(`  ${tipoPermitido ? '✅' : '❌'} Tipo permitido? ${tipoPermitido}`);
    
    if (!tipoPermitido) {
      console.log('  ❌ Post rejeitado: tipo não está na lista permitida');
      return false;
    }

    // 2. Verificar data
    // ✅ CORREÇÃO: Buscar nos campos corretos do MongoDB
    const dataInicioObj = desafio?.dataInicio;
    console.log(`  📅 dataInicio (raw):`, dataInicioObj);
    
    if (dataInicioObj) {
      const dataInicioDesafio = parseDataMongoDB(dataInicioObj);
      
      // ✅ CORREÇÃO: Posts usam campo "data" não "createdAt"
      const dataPostObj = post.data || post.createdAt || post.dataPublicacao || post.createdDate;
      console.log(`  📅 data do post (raw):`, dataPostObj);
      
      const dataPost = parseDataMongoDB(dataPostObj);
      
      console.log(`  📅 Data início do desafio:`, dataInicioDesafio);
      console.log(`  📅 Data criação post:`, dataPost);
      
      if (!dataInicioDesafio || !dataPost) {
        console.warn('  ⚠️ Não foi possível validar data - permitindo post');
      } else {
        if (dataPost < dataInicioDesafio) {
          console.log('  ❌ Post rejeitado: criado antes do início do desafio');
          console.log(`     Post: ${dataPost.toLocaleDateString()} < Desafio: ${dataInicioDesafio.toLocaleDateString()}`);
          return false;
        } else {
          console.log(`  ✅ Data válida: ${dataPost.toLocaleDateString()} >= ${dataInicioDesafio.toLocaleDateString()}`);
        }
      }
    } else {
      console.log('  ℹ️ Desafio sem data de início - permitindo qualquer data');
    }

    console.log('  ✅ Post ELEGÍVEL!');
    return true;
  });

  console.log(`\n📊 RESULTADO: ${postsElegiveis.length} posts elegíveis de ${userPosts.length} totais\n`);

  /**
   * @private
   * Manipulador de submissão do formulário.
   * Despacha a criação de uma nova participação no Redux.
   * @param {React.FormEvent} e O evento de submissão.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedPostId) {
      setError("Selecione um post para participar");
      return;
    }

    if (!currentUserId || !id) {
      setError("Dados inválidos");
      return;
    }

    try {
      await dispatch(
        createParticipacao({
          desafioId: id,
          postId: selectedPostId,
          usuarioId: currentUserId,
        })
      ).unwrap();

      alert("✅ Participação registrada com sucesso!");
      navigate(`/desafios/${id}`);
    } catch (err) {
      console.error("❌ Erro ao participar:", err);
      setError(err || "Não foi possível registrar sua participação. Tente novamente.");
    }
  };

  if (!currentUser) {
    return (
      <>
        <HeaderForYou />
        <div className="pd-container">
          <div className="pd-shell">
            <h2>Faça login para participar</h2>
            <button onClick={() => navigate("/login")} className="pd-btn primary">
              Ir para Login
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!desafio) {
    return (
      <>
        <HeaderForYou />
        <div className="pd-container">
          <div className="pd-shell">
            <div className="loading">Carregando desafio...</div>
          </div>
        </div>
      </>
    );
  }

  // ✅ Usar função normalizada para exibir tipos
  const tiposAceitos = getTiposAceitos();
  const temTiposEspecificos = (desafio.tipoAceito && Array.isArray(desafio.tipoAceito) && desafio.tipoAceito.length > 0) ||
                              (desafio.tiposPermitidos && Array.isArray(desafio.tiposPermitidos) && desafio.tiposPermitidos.length > 0);
  const tiposTexto = temTiposEspecificos
    ? tiposAceitos.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
    : "Todos os tipos (Música, Visual, Texto)";

  /**
   * @private
   * Formata um objeto de data raw para string no formato pt-BR.
   * @param {any} dataObj O objeto de data a ser formatado.
   * @returns {string} A data formatada ou 'Data não definida'.
   */
  const formatarData = (dataObj) => {
    const data = parseDataMongoDB(dataObj);
    return data ? data.toLocaleDateString('pt-BR') : 'Data não definida';
  };

  return (
    <>
      <HeaderForYou />
      <div className="pd-container">
        <div className="pd-shell">
          <div className="pd-header">
            <button className="pd-back" onClick={() => navigate(`/desafios/${id}`)}>
              <i className="fas fa-arrow-left"></i>
              <span>Voltar</span>
            </button>
            <h1 className="pd-title">Participar do Desafio</h1>
            <h2 className="pd-subtitle">{desafio.titulo}</h2>
          </div>

          <div className="pd-info">
            <div className="info-item">
              <i className="fas fa-info-circle"></i>
              <span>{desafio.descricao}</span>
            </div>
            <div className="info-item">
              <i className="fas fa-palette"></i>
              <span>Tipos aceitos: <strong>{tiposTexto}</strong></span>
            </div>
            {desafio.dataInicio && (
              <div className="info-item">
                <i className="fas fa-calendar"></i>
                <span>
                  Somente posts criados após <strong>{formatarData(desafio.dataInicio)}</strong>
                </span>
              </div>
            )}
          </div>

          <form className="pd-form" onSubmit={handleSubmit}>
            <div className="pd-field">
              <label htmlFor="post-select">Selecione seu post *</label>
              
              {postsElegiveis.length === 0 ? (
                <div className="pd-empty">
                  <i className="fas fa-inbox"></i>
                  <p>Você não tem posts elegíveis para este desafio</p>
                  <small>
                    {userPosts.length === 0
                      ? "Você ainda não criou nenhum post."
                      : desafio.dataInicio 
                        ? `Certifique-se de criar um post após ${formatarData(desafio.dataInicio)}.`
                        : "Crie posts para participar deste desafio."}
                  </small>
                  
                  {/* ✅ DEBUG: Mostrar informações adicionais */}
                  <div className="debug-info">
                    <details>
                      <summary>🔍 Ver informações de debug</summary>
                      <div className="debug-content">
                        <p><strong>Total de posts seus:</strong> {userPosts.length}</p>
                        <p><strong>Tipos aceitos:</strong> {tiposTexto}</p>
                        <p><strong>Tem tipos específicos?</strong> {temTiposEspecificos ? 'Sim' : 'Não (aceita todos)'}</p>
                        <p><strong>tipoAceito (raw):</strong> {JSON.stringify(desafio.tipoAceito)}</p>
                        <p><strong>tiposPermitidos (raw):</strong> {JSON.stringify(desafio.tiposPermitidos)}</p>
                        <p><strong>dataInicio (raw):</strong> {JSON.stringify(desafio.dataInicio)}</p>
                        <p><strong>Data início (formatada):</strong> {formatarData(desafio.dataInicio)}</p>
                        {userPosts.length > 0 && (
                          <div>
                            <p><strong>Seus posts:</strong></p>
                            <ul>
                              {userPosts.map(p => (
                                <li key={p._id || p.id}>
                                  <strong>{p.titulo || 'Sem título'}</strong><br/>
                                  Tipo: <code>{p.tipo || 'não definido'}</code><br/>
                                  data (raw): {JSON.stringify(p.data || p.createdAt)}<br/>
                                  Data: {formatarData(p.data || p.createdAt)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="pd-posts-grid">
                  {postsElegiveis.map((post) => (
                    <label
                      key={post._id || post.id}
                      className={`pd-post-card ${
                        selectedPostId === (post._id || post.id) ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="post"
                        value={post._id || post.id}
                        checked={selectedPostId === (post._id || post.id)}
                        onChange={(e) => setSelectedPostId(e.target.value)}
                      />
                      <div className="post-content">
                        <div className="post-header">
                          <span className={`post-badge ${post.tipo}`}>
                            <i
                              className={`fas fa-${
                                post.tipo === "musica"
                                  ? "music"
                                  : post.tipo === "visual"
                                  ? "image"
                                  : "file-alt"
                              }`}
                            ></i>
                            {post.tipo}
                          </span>
                          <span className="post-date">
                            {formatarData(post.data || post.createdAt)}
                          </span>
                        </div>
                        <h4 className="post-title">{post.titulo || "Sem título"}</h4>
                        <div className="post-stats">
                          <span>
                            <i className="fas fa-star"></i>
                            {post.ratingAvg?.toFixed(1) || "0.0"} ({post.ratingCount || 0})
                          </span>
                          <span>
                            <i className="fas fa-comment"></i>
                            {post.commentCount || 0}
                          </span>
                        </div>
                      </div>
                      <div className="post-check">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="pd-error">{error}</div>}

            {postsElegiveis.length > 0 && (
              <div className="pd-actions">
                <button
                  type="button"
                  className="pd-btn secondary"
                  onClick={() => navigate(`/desafios/${id}`)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="pd-btn primary" disabled={loading || !selectedPostId}>
                  <i className="fas fa-paper-plane"></i>
                  <span>{loading ? "Enviando..." : "Participar"}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        :root {
          --accent: #5e17eb;
          --accent-2: #7b3ff2;
          --success: #22c55e;
          --danger: #ef4444;
          --text-strong: #f7f8ff;
          --text-soft: rgba(255, 255, 255, 0.9);
          --surface: rgba(255, 255, 255, 0.16);
        }

        * {
          box-sizing: border-box;
        }

        /* Scroll suave em toda a página */
        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Otimização para telas longas (21:9, 20:9, etc) */
        @supports (aspect-ratio: 9/19) {
          .pd-posts-grid {
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 4px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }

          .pd-posts-grid::-webkit-scrollbar {
            width: 6px;
          }

          .pd-posts-grid::-webkit-scrollbar-track {
            background: transparent;
          }

          .pd-posts-grid::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }

          .pd-posts-grid::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }
        }

        /* ===== CONTAINER RESPONSIVO ===== */
        .pd-container {
          max-width: 900px;
          margin: 0 auto;
          padding: clamp(16px, 3vw, 28px) clamp(12px, 3vw, 20px) 60px;
          color: var(--text-strong);
          width: 100%;
          box-sizing: border-box;
        }

        .pd-shell {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1));
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: clamp(16px, 4vw, 28px);
          backdrop-filter: blur(18px) saturate(1.15);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
          padding: clamp(20px, 4vw, 32px) clamp(16px, 3vw, 28px);
          width: 100%;
          box-sizing: border-box;
        }

        /* ===== HEADER RESPONSIVO ===== */
        .pd-header {
          margin-bottom: clamp(24px, 4vw, 32px);
        }

        .pd-back {
          display: inline-flex;
          align-items: center;
          gap: clamp(6px, 1.5vw, 8px);
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #fff;
          padding: clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px);
          border-radius: clamp(10px, 2vw, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: clamp(12px, 2.5vw, 16px);
          font-size: clamp(0.85rem, 2vw, 1rem);
        }

        .pd-back:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateX(-2px);
        }

        .pd-back i {
          font-size: clamp(0.85rem, 2vw, 1rem);
        }

        .pd-title {
          margin: 0 0 clamp(6px, 1.5vw, 8px);
          font-weight: 800;
          font-size: clamp(1.3rem, 4vw, 1.75rem);
          background: linear-gradient(90deg, #fff, #e9eaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.2;
        }

        .pd-subtitle {
          margin: 0;
          color: var(--text-soft);
          font-size: clamp(0.95rem, 2.5vw, 1.2rem);
          font-weight: 600;
          line-height: 1.3;
          word-break: break-word;
        }

        /* ===== INFO BOX RESPONSIVO ===== */
        .pd-info {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: clamp(14px, 3vw, 18px);
          padding: clamp(16px, 3vw, 20px);
          margin-bottom: clamp(20px, 3.5vw, 28px);
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 2vw, 12px);
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: clamp(10px, 2vw, 12px);
          color: var(--text-soft);
          font-size: clamp(0.85rem, 2vw, 0.95rem);
          line-height: 1.5;
        }

        .info-item i {
          font-size: clamp(16px, 3vw, 18px);
          opacity: 0.9;
          min-width: clamp(18px, 3vw, 20px);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .info-item span {
          word-break: break-word;
        }

        /* ===== FORM RESPONSIVO ===== */
        .pd-form {
          display: flex;
          flex-direction: column;
          gap: clamp(20px, 3vw, 24px);
        }

        .pd-field label {
          display: block;
          font-weight: 700;
          color: var(--text-strong);
          margin-bottom: clamp(12px, 2.5vw, 16px);
          font-size: clamp(0.95rem, 2vw, 1.05rem);
        }

        /* ===== EMPTY STATE RESPONSIVO ===== */
        .pd-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(12px, 2.5vw, 16px);
          padding: clamp(32px, 5vw, 48px) clamp(16px, 3vw, 24px);
          background: rgba(255, 255, 255, 0.08);
          border: 2px dashed rgba(255, 255, 255, 0.24);
          border-radius: clamp(14px, 3vw, 18px);
          text-align: center;
        }

        .pd-empty i {
          font-size: clamp(36px, 7vw, 48px);
          opacity: 0.6;
        }

        .pd-empty p {
          margin: 0;
          font-size: clamp(1rem, 2.2vw, 1.1rem);
          font-weight: 600;
          line-height: 1.3;
          padding: 0 clamp(8px, 2vw, 16px);
        }

        .pd-empty small {
          color: rgba(255, 255, 255, 0.75);
          max-width: 500px;
          line-height: 1.5;
          font-size: clamp(0.8rem, 1.8vw, 0.9rem);
          padding: 0 clamp(8px, 2vw, 16px);
        }

        /* ===== DEBUG INFO RESPONSIVO ===== */
        .debug-info {
          width: 100%;
          max-width: 600px;
          margin-top: clamp(12px, 2.5vw, 16px);
        }

        .debug-info details {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: clamp(10px, 2vw, 12px);
          padding: clamp(10px, 2vw, 12px);
        }

        .debug-info summary {
          cursor: pointer;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          user-select: none;
          font-size: clamp(0.85rem, 1.8vw, 0.95rem);
        }

        .debug-info summary:hover {
          color: #fff;
        }

        .debug-content {
          margin-top: clamp(10px, 2vw, 12px);
          padding: clamp(10px, 2vw, 12px);
          background: rgba(0, 0, 0, 0.3);
          border-radius: clamp(6px, 1.5vw, 8px);
          font-size: clamp(0.75rem, 1.6vw, 0.85rem);
          text-align: left;
          overflow-x: auto;
        }

        .debug-content p {
          margin: clamp(6px, 1.5vw, 8px) 0;
          word-break: break-word;
        }

        .debug-content code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: clamp(0.7rem, 1.5vw, 0.8rem);
          word-break: break-all;
        }

        .debug-content ul {
          margin: clamp(6px, 1.5vw, 8px) 0;
          padding-left: clamp(16px, 3vw, 20px);
        }

        .debug-content li {
          margin: clamp(6px, 1.5vw, 8px) 0;
          font-size: clamp(0.7rem, 1.5vw, 0.8rem);
          line-height: 1.6;
        }

        /* ===== POSTS GRID RESPONSIVO ===== */
        .pd-posts-grid {
          display: grid;
          gap: clamp(8px, 1.5vw, 10px);
          width: 100%;
        }

        .pd-post-card {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: clamp(10px, 2vw, 12px);
          padding: clamp(8px, 1.5vw, 10px) clamp(12px, 2.5vw, 14px);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08));
          border: 2px solid rgba(255, 255, 255, 0.22);
          border-radius: clamp(10px, 2vw, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: clamp(56px, 10vw, 60px);
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .pd-post-card:hover {
          border-color: rgba(255, 255, 255, 0.35);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.12));
          transform: translateY(-1px);
        }

        .pd-post-card.selected {
          border-color: var(--accent);
          background: linear-gradient(135deg, rgba(94, 23, 235, 0.2), rgba(123, 63, 242, 0.15));
          box-shadow: 0 6px 16px rgba(94, 23, 235, 0.3);
        }

        .pd-post-card input[type="radio"] {
          display: none;
        }

        .post-content {
          display: flex;
          flex-direction: column;
          gap: clamp(3px, 0.8vw, 4px);
          min-width: 0; /* Permite que o conteúdo encolha */
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: clamp(6px, 1.5vw, 8px);
          flex-wrap: wrap;
        }

        .post-badge {
          display: inline-flex;
          align-items: center;
          gap: clamp(3px, 0.8vw, 4px);
          padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px);
          border-radius: 999px;
          font-size: clamp(0.65rem, 1.5vw, 0.75rem);
          font-weight: 700;
          text-transform: capitalize;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          line-height: 1.4;
          white-space: nowrap;
        }

        .post-badge i {
          font-size: clamp(0.6rem, 1.3vw, 0.7rem);
        }

        .post-badge.musica {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.2));
        }

        .post-badge.visual {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(147, 51, 234, 0.2));
        }

        .post-badge.texto {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.2));
        }

        .post-date {
          font-size: clamp(0.7rem, 1.6vw, 0.8rem);
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          white-space: nowrap;
        }

        .post-title {
          margin: 0;
          font-size: clamp(0.85rem, 2vw, 0.95rem);
          font-weight: 700;
          color: var(--text-strong);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .post-stats {
          display: flex;
          gap: clamp(8px, 2vw, 12px);
          font-size: clamp(0.7rem, 1.6vw, 0.8rem);
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.4;
          flex-wrap: wrap;
        }

        .post-stats span {
          display: flex;
          align-items: center;
          gap: clamp(3px, 0.8vw, 4px);
          white-space: nowrap;
        }

        .post-stats i {
          font-size: clamp(0.65rem, 1.4vw, 0.75rem);
          opacity: 0.8;
        }

        .post-check {
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .post-check i {
          font-size: clamp(20px, 3.5vw, 22px);
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .pd-post-card.selected .post-check i {
          color: var(--accent);
          font-size: clamp(24px, 4vw, 26px);
        }

        /* ===== ERROR RESPONSIVO ===== */
        .pd-error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 18px);
          border-radius: clamp(12px, 2.5vw, 14px);
          font-weight: 600;
          font-size: clamp(0.85rem, 1.8vw, 0.95rem);
          line-height: 1.4;
        }

        /* ===== ACTIONS RESPONSIVO ===== */
        .pd-actions {
          display: flex;
          gap: clamp(10px, 2vw, 12px);
          justify-content: flex-end;
          margin-top: clamp(12px, 2.5vw, 16px);
          flex-wrap: wrap;
        }

        /* ===== BUTTONS RESPONSIVO ===== */
        .pd-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(6px, 1.5vw, 8px);
          padding: clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px);
          border-radius: clamp(12px, 2.5vw, 14px);
          border: 1px solid rgba(255, 255, 255, 0.28);
          font-weight: 800;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: clamp(0.85rem, 1.8vw, 0.95rem);
          white-space: nowrap;
        }

        .pd-btn i {
          font-size: clamp(0.85rem, 1.8vw, 0.95rem);
        }

        .pd-btn.primary {
          background: linear-gradient(135deg, var(--success), #16a34a);
          color: #fff;
          box-shadow: 0 12px 26px rgba(34, 197, 94, 0.28);
        }

        .pd-btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 32px rgba(34, 197, 94, 0.36);
          filter: brightness(1.05);
        }

        .pd-btn.primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .pd-btn.secondary {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .pd-btn.secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .pd-btn.secondary:active:not(:disabled) {
          transform: translateY(0);
        }

        .pd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== LOADING RESPONSIVO ===== */
        .loading {
          text-align: center;
          padding: clamp(32px, 5vw, 40px);
          color: var(--text-soft);
          font-size: clamp(0.95rem, 2vw, 1.05rem);
        }

        /* ===== MEDIA QUERIES ===== */
        
        /* Tablets e dispositivos médios */
        @media (max-width: 768px) {
          .pd-container {
            padding-bottom: 80px;
          }

          .pd-info {
            gap: 14px;
          }

          .info-item {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .pd-shell {
            padding: 20px 16px;
          }

          .pd-actions {
            flex-direction: column-reverse;
          }

          .pd-btn {
            width: 100%;
            justify-content: center;
          }

          .post-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .pd-post-card {
            padding: 10px 12px;
          }

          .post-title {
            font-size: 0.9rem;
          }

          .post-stats {
            font-size: 0.75rem;
          }

          .debug-content {
            font-size: 0.75rem;
          }
        }

        /* Mobile pequeno */
        @media (max-width: 380px) {
          .pd-title {
            font-size: 1.2rem;
          }

          .pd-subtitle {
            font-size: 0.9rem;
          }

          .info-item {
            font-size: 0.8rem;
          }

          .post-badge {
            font-size: 0.65rem;
            padding: 2px 6px;
          }

          .post-date {
            font-size: 0.7rem;
          }

          .pd-empty i {
            font-size: 32px;
          }

          .pd-empty p {
            font-size: 0.95rem;
          }

          .pd-empty small {
            font-size: 0.75rem;
          }
        }

        /* ===== DISPOSITIVOS 21:9 VERTICAIS (Telas altas e estreitas) ===== */
        
        /* Detecta aspect ratio alto (21:9, 20:9, 19.5:9) */
        @media (max-width: 450px) and (min-aspect-ratio: 9/19) {
          .pd-container {
            padding: 12px 10px 60px;
            max-width: 100%;
          }

          .pd-shell {
            padding: 16px 12px;
            border-radius: 14px;
          }

          .pd-header {
            margin-bottom: 16px;
          }

          .pd-back {
            padding: 6px 10px;
            font-size: 0.8rem;
            margin-bottom: 10px;
          }

          .pd-title {
            font-size: 1.15rem;
            margin-bottom: 6px;
          }

          .pd-subtitle {
            font-size: 0.85rem;
            line-height: 1.25;
          }

          .pd-info {
            padding: 12px;
            gap: 10px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .info-item {
            font-size: 0.8rem;
            gap: 8px;
          }

          .info-item i {
            font-size: 14px;
            min-width: 16px;
          }

          .pd-form {
            gap: 16px;
          }

          .pd-field label {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .pd-empty {
            padding: 24px 12px;
            gap: 10px;
          }

          .pd-empty i {
            font-size: 28px;
          }

          .pd-empty p {
            font-size: 0.9rem;
            padding: 0 8px;
          }

          .pd-empty small {
            font-size: 0.75rem;
            padding: 0 8px;
          }

          .pd-posts-grid {
            gap: 6px;
          }

          .pd-post-card {
            padding: 8px 10px;
            gap: 8px;
            min-height: 52px;
            border-radius: 10px;
          }

          .post-content {
            gap: 2px;
          }

          .post-header {
            gap: 4px;
          }

          .post-badge {
            font-size: 0.6rem;
            padding: 2px 6px;
            gap: 3px;
          }

          .post-badge i {
            font-size: 0.55rem;
          }

          .post-date {
            font-size: 0.65rem;
          }

          .post-title {
            font-size: 0.8rem;
            line-height: 1.2;
          }

          .post-stats {
            font-size: 0.7rem;
            gap: 8px;
          }

          .post-stats i {
            font-size: 0.6rem;
          }

          .post-check i {
            font-size: 18px;
          }

          .pd-post-card.selected .post-check i {
            font-size: 22px;
          }

          .pd-error {
            padding: 10px 12px;
            font-size: 0.8rem;
            border-radius: 10px;
          }

          .pd-actions {
            gap: 8px;
            margin-top: 12px;
          }

          .pd-btn {
            padding: 10px 16px;
            font-size: 0.8rem;
            border-radius: 10px;
            gap: 6px;
          }

          .debug-info {
            margin-top: 10px;
          }

          .debug-info details {
            padding: 8px;
          }

          .debug-info summary {
            font-size: 0.75rem;
          }

          .debug-content {
            padding: 8px;
            font-size: 0.7rem;
            margin-top: 8px;
          }

          .debug-content li {
            font-size: 0.65rem;
          }
        }

        /* Dispositivos 21:9 muito estreitos (< 360px) */
        @media (max-width: 360px) and (min-aspect-ratio: 9/19) {
          .pd-container {
            padding: 10px 8px 50px;
          }

          .pd-shell {
            padding: 14px 10px;
            border-radius: 12px;
          }

          .pd-header {
            margin-bottom: 14px;
          }

          .pd-title {
            font-size: 1.05rem;
          }

          .pd-subtitle {
            font-size: 0.8rem;
          }

          .pd-info {
            padding: 10px;
            gap: 8px;
          }

          .info-item {
            font-size: 0.75rem;
            gap: 6px;
          }

          .info-item i {
            font-size: 13px;
            min-width: 14px;
          }

          .pd-field label {
            font-size: 0.85rem;
          }

          .pd-empty {
            padding: 20px 10px;
          }

          .pd-empty i {
            font-size: 24px;
          }

          .pd-empty p {
            font-size: 0.85rem;
          }

          .pd-empty small {
            font-size: 0.7rem;
          }

          .pd-post-card {
            padding: 6px 8px;
            min-height: 48px;
          }

          .post-title {
            font-size: 0.75rem;
          }

          .post-stats {
            font-size: 0.65rem;
            gap: 6px;
          }

          .post-badge {
            font-size: 0.55rem;
            padding: 1px 5px;
          }

          .post-date {
            font-size: 0.6rem;
          }

          .pd-btn {
            padding: 9px 14px;
            font-size: 0.75rem;
          }
        }

        /* Landscape em mobile */
        @media (max-width: 900px) and (orientation: landscape) {
          .pd-container {
            padding-top: 12px;
            padding-bottom: 40px;
          }

          .pd-header {
            margin-bottom: 20px;
          }

          .pd-info {
            margin-bottom: 20px;
          }

          .pd-empty {
            padding: 24px 16px;
          }

          .pd-empty i {
            font-size: 36px;
          }
        }

        /* ===== OTIMIZAÇÕES PARA ALTURA LIMITADA ===== */
        
        /* Telas com altura muito limitada (ex: landscape estreito) */
        @media (max-height: 600px) {
          .pd-container {
            padding-top: 10px;
            padding-bottom: 30px;
          }

          .pd-header {
            margin-bottom: 14px;
          }

          .pd-info {
            margin-bottom: 14px;
            padding: 12px;
          }

          .pd-form {
            gap: 14px;
          }

          .pd-empty {
            padding: 20px 16px;
          }

          .pd-empty i {
            font-size: 32px;
          }
        }

        /* Altura muito limitada + largura estreita (landscape mobile) */
        @media (max-height: 500px) and (max-width: 900px) {
          .pd-shell {
            padding: 14px 16px;
          }

          .pd-header {
            margin-bottom: 12px;
          }

          .pd-title {
            font-size: 1.1rem;
          }

          .pd-subtitle {
            font-size: 0.85rem;
          }

          .pd-info {
            padding: 10px;
            gap: 8px;
            margin-bottom: 12px;
          }

          .info-item {
            font-size: 0.8rem;
          }

          .pd-field label {
            margin-bottom: 8px;
          }

          .pd-empty {
            padding: 16px 12px;
            gap: 8px;
          }

          .pd-empty i {
            font-size: 24px;
          }

          .pd-empty p {
            font-size: 0.85rem;
          }

          .pd-post-card {
            padding: 6px 10px;
            min-height: 44px;
          }

          .pd-actions {
            margin-top: 10px;
            gap: 8px;
          }

          .pd-btn {
            padding: 8px 14px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </>
  );
}

// Exportações
export default ParticipatePage;
export { ParticipatePage };