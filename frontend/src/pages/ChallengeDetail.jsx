// src/pages/ChallengeDetail.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import HeaderForYou from "../components/Header2";
import axios from "axios";

import {
  fetchDesafioById,
  selectDesafioById,
} from "../redux/desafiosSlice";

import { fetchParticipacoesByDesafio } from "../redux/participacoesSlice";
import { makeSelectRankingByStars } from "../redux/selectorsDesafios";
import { fetchPosts } from "../redux/postsSlice";
import { fetchUsuarios } from "../redux/usuariosSlice";

// Placeholder até ligar no ratingsSlice
function StarRater() { return null; }

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // novo formato: currentUserState = { user, token }
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;

  const usuarios = useSelector((s) => s.user?.usuarios || []);
  const posts = useSelector((s) => s.posts?.lista || []);

  const desafio = useSelector(selectDesafioById(id));
  const selectRanking = makeSelectRankingByStars(id);
  const ranking = useSelector(selectRanking) || [];

  // Normaliza id do currentUser (aceita _id ou id)
  const currentUserId = currentUser ? (currentUser._id ?? currentUser.id ?? null) : null;
  const currentUserRole = currentUser ? (currentUser.role ?? currentUser.tipo ?? null) : null;

  // verificadores de permissão: comparar com cuidado _id / id e permitir admin via role
  const isCreator = !!(currentUser && desafio && String(desafio.criadorId) === String(currentUserId));
  const isAdmin = currentUserRole === "admin" || currentUserRole === "ADMIN";
  const canManage = isCreator || isAdmin;

  useEffect(() => {
    dispatch(fetchDesafioById(id));
    dispatch(fetchParticipacoesByDesafio(id));
    dispatch(fetchPosts());
    dispatch(fetchUsuarios());
  }, [dispatch, id]);

  // ===== Helpers de status derivado (finalizado quando dataFim passou) =====
  const toTime = (v) => (v ? new Date(v).getTime() : 0);
  const isExpired = (d) => (d?.dataFim ? toTime(d.dataFim) < Date.now() : false);
  const derivedStatus = desafio
    ? (isExpired(desafio) ? "finalizado" : (desafio.status || "aberto"))
    : "aberto";

  const handlePublish = async () => {
    if (!canManage || desafio?.status !== "rascunho") return;
    if (!confirm("Publicar este desafio agora?")) return;
    
    const token = currentUserState?.token;
    if (!token) {
      alert("Você precisa estar autenticado para publicar desafios.");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/desafios/${id}`, 
        {
          status: "publicado",
          updatedAt: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      dispatch(fetchDesafioById(id));
      alert("✅ Desafio publicado com sucesso!");
    } catch (e) {
      console.error("Erro ao publicar:", e);
      alert("Não foi possível publicar o desafio.");
    }
  };

  const handleDelete = async () => {
    if (!canManage) return;
    if (!confirm("Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita.")) return;
    
    const token = currentUserState?.token;
    if (!token) {
      alert("Você precisa estar autenticado para excluir desafios.");
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/desafios/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("✅ Desafio excluído com sucesso!");
      navigate("/desafios");
    } catch (e) {
      console.error("Erro ao excluir:", e);
      const errorMsg = e.response?.data?.message || "Não foi possível excluir o desafio.";
      alert(`Erro: ${errorMsg}`);
    }
  };

  // busca usuário/post por id levando em conta _id / id e formatos numéricos/strings
  const findUserById = (uid) =>
    usuarios.find((u) => String(u._id ?? u.id ?? u.usuarioId ?? u.idStr ?? "") === String(uid));

  const findPostById = (pid) =>
    posts.find((p) => String(p._id ?? p.id ?? p.postId ?? "") === String(pid));

  if (!desafio) {
    return (
      <>
        <HeaderForYou />
        <div className="fy-container">
          <div className="content-shell">
            <div className="loading">Carregando…</div>
          </div>
        </div>
        <style>{styles}</style>
      </>
    );
  }

  // "finalizado" herda o visual de "encerrado"
  const statusClass =
    derivedStatus === "finalizado" || derivedStatus === "encerrado"
      ? "encerrado"
      : derivedStatus === "rascunho"
      ? "rascunho"
      : "aberto";

  const criador = findUserById(desafio.criadorId);
  const criadorNome =
    (criador?.nome && criador?.nome.trim()) ? criador.nome : (criador?.username || `@user${desafio.criadorId}`);

  // botão "Participar" só aparece se NÃO estiver finalizado/encerrado e não for rascunho
  const canParticipate =
    derivedStatus !== "finalizado" &&
    derivedStatus !== "encerrado" &&
    derivedStatus !== "rascunho";

  return (
    <>
      <HeaderForYou />

      <div className="fy-container">
        <div className="content-shell chd-shell">
          {/* Cabeçalho */}
          <div className="chd-head">
            <div className="chd-badges">
              <span className={`badge tipo ${desafio.tipo === "oficial" ? "oficial" : "comunidade"}`}>
                {desafio.tipo}
              </span>
              {/* usa o status derivado no texto e na classe */}
              <span className={`badge status ${statusClass}`}>{derivedStatus}</span>
            </div>

            <h1 className="chd-title">{desafio.titulo}</h1>
            <p className="chd-desc">{desafio.descricao}</p>

            <div className="chd-meta">
              {desafio.dataInicio && (
                <div className="meta-item">
                  <i className="fa-regular fa-calendar"></i>
                  <span>Início: {new Date(desafio.dataInicio).toLocaleDateString()}</span>
                </div>
              )}
              {desafio.dataFim && (
                <div className="meta-item">
                  <i className="fa-regular fa-hourglass-half"></i>
                  <span>Fim: {new Date(desafio.dataFim).toLocaleDateString()}</span>
                </div>
              )}
              {criador && (
                <div className="meta-item clickable" onClick={() => navigate(`/user/${criador.username}`)}>
                  <i className="fa-regular fa-user"></i>
                  <span>Criador: {criadorNome}</span>
                </div>
              )}
            </div>

            <div className="head-actions">
              {canParticipate ? (
                <Link className="btn-primary-like" to={`/desafios/${id}/participar`}>
                  Participar
                </Link>
              ) : (
                // botão desabilitado para sinalizar que não aceita mais
                <button className="btn-primary-like" disabled title="Este desafio não aceita mais participações">
                  {derivedStatus === "rascunho" ? "Indisponível" : "Participações encerradas"}
                </button>
              )}

              {desafio.status === "rascunho" && canManage && (
                <button className="btn-primary-like alt" onClick={handlePublish} title="Publicar desafio">
                  <i className="fa-solid fa-upload"></i>
                  <span>Publicar</span>
                </button>
              )}

              {canManage && (
                <button className="btn-danger-like" onClick={handleDelete} title="Excluir desafio">
                  <i className="fa-regular fa-trash-can"></i>
                  <span>Excluir</span>
                </button>
              )}
            </div>
          </div>

          {/* Ranking */}
          <div className="chd-section">
            <h3 className="section-title">Ranking (estrelas do post)</h3>

            {!ranking.length ? (
              <div className="empty">
                <i className="fas fa-star-half-stroke"></i>
                <p>Sem participações ainda.</p>
              </div>
            ) : (
              <div className="rank-list">
                {ranking.map((r, idx) => {
                  const post = findPostById(r.postId);
                  const autor = post ? findUserById(post.usuarioId || post.userId || post.author) : null;
                  
                  // 🔍 DEBUG
                  if (!autor && post) {
                    console.log('⚠️ [Ranking] Post sem autor encontrado:', {
                      postId: r.postId,
                      post: post,
                      usuarioId: post.usuarioId,
                      userId: post.userId,
                      author: post.author,
                      usuarios: usuarios.length
                    });
                  }
                  
                  const autorNome =
                    (autor?.nome && autor?.nome.trim()) ? autor.nome : (autor?.username ? `@${autor.username}` : "Autor");

                  return (
                    <div key={r.participacaoId ?? r.id ?? `${r.postId}-${idx}`} className="rank-item">
                      <div className="rank-left">
                        <div className="pos">#{idx + 1}</div>
                        <div className="info">
                          <div className="title">
                            {r.titulo || `Post ${r.postId}`} <span className="pill">{r.tipo}</span>
                          </div>
                          <div className="meta">
                            Média: <b>{Number(r.ratingAvg || 0).toFixed(2)}</b> • Votos:{" "}
                            <b>{Number(r.ratingCount || 0)}</b>
                            {autor && (
                              <>
                                {" "}• Autor:{" "}
                                <span
                                  className="autor-link"
                                  onClick={() => navigate(`/user/${autor.username}`)}
                                  title={`Ver perfil de ${autorNome}`}
                                >
                                  {autorNome}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rank-right">
                        {/* Botão Perfil do usuário do post */}
                        {autor ? (
                          <button
                            className="btn-ghost mini"
                            onClick={() => navigate(`/user/${autor.username}`)}
                            title="Ver perfil do autor"
                          >
                            <i className="fa-regular fa-user"></i>
                            <span>Perfil</span>
                          </button>
                        ) : (
                          <div style={{ opacity: .5 }}></div>
                        )}
                        <StarRater postId={r.postId} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* estilos inline */}
      <style>{styles}</style>
    </>
  );
}

const styles = `
:root{
  --accent:#5e17eb; --accent-2:#7b3ff2;
  --surface-border: rgba(255,255,255,0.22);
  --surface-hover-border: rgba(255,255,255,0.30);
  --text-strong:#f7f8ff; --text-soft:rgba(255,255,255,.9); --muted:rgba(255,255,255,.75);
  --shadow-1:0 10px 24px rgba(0,0,0,.20); --shadow-2:0 18px 40px rgba(0,0,0,.28);
  --danger:#ff5b6e; --danger-2:#ff3350;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.fy-container{ 
  max-width:1100px; 
  margin:0 auto; 
  padding:clamp(16px, 3vw, 28px) clamp(12px, 3vw, 20px) 60px; 
  color:var(--text-strong); 
  background:transparent;
  width: 100%;
}

.content-shell{
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
  border:1px solid var(--surface-border);
  border-radius: clamp(16px, 4vw, 28px);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  box-shadow: var(--shadow-1), inset 0 1px 0 rgba(255,255,255,.22);
  padding: clamp(14px, 3vw, 18px) clamp(12px, 2.5vw, 16px) clamp(16px, 3vw, 20px);
  width: 100%;
}

.chd-shell{ display:grid; gap:clamp(18px, 3vw, 22px); }

.chd-head{ display:grid; gap:clamp(10px, 2vw, 12px); }

.chd-badges{ 
  display:flex; 
  gap:clamp(6px, 1.5vw, 8px); 
  flex-wrap:wrap; 
}

.badge{
  font-size:clamp(0.7rem, 1.6vw, 0.78rem); 
  padding:clamp(0.3rem, 0.8vw, 0.4rem) clamp(0.5rem, 1.2vw, 0.65rem); 
  border-radius:999px;
  border:1px solid rgba(255,255,255,.26); 
  background: rgba(255,255,255,.14);
  text-transform:capitalize; 
  letter-spacing:.2px;
  white-space: nowrap;
}

.badge.tipo.oficial{ background:linear-gradient(135deg, rgba(99,102,241,.30), rgba(59,130,246,.26)); border-color:rgba(147,197,253,.45); }
.badge.tipo.comunidade{ background:linear-gradient(135deg, rgba(168,85,247,.30), rgba(236,72,153,.24)); border-color:rgba(232,121,249,.42); }
.badge.status.aberto{ background:rgba(34,197,94,.24); border-color:rgba(134,239,172,.45); }
.badge.status.encerrado{ background:rgba(148,163,184,.24); border-color:rgba(148,163,184,.45); }
.badge.status.rascunho{ background:rgba(255,214,102,.24); border-color:rgba(255,214,102,.45); }

.chd-title{ 
  margin:0; 
  font-weight:800; 
  letter-spacing:.2px; 
  font-size: clamp(1.3rem, 4vw, 1.875rem); 
  text-shadow: 0 2px 14px rgba(0,0,0,.25);
  line-height: 1.2;
  word-break: break-word;
}

.chd-desc{ 
  margin:0; 
  color:var(--text-soft); 
  font-size: clamp(0.9rem, 2vw, 1rem);
  line-height: 1.5;
  word-break: break-word;
}

.chd-meta{ 
  display:flex; 
  gap:clamp(10px, 2vw, 14px); 
  flex-wrap:wrap; 
  color:var(--muted);
  font-size: clamp(0.8rem, 1.8vw, 0.95rem);
}

.meta-item{ 
  display:flex; 
  gap:clamp(6px, 1.5vw, 8px); 
  align-items:center;
  word-break: break-word;
}

.meta-item.clickable{ cursor:pointer; }
.meta-item.clickable:hover{ color: var(--text-strong); }

.meta-item i {
  flex-shrink: 0;
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.head-actions{ 
  margin-top:clamp(2px, 0.8vw, 4px); 
  display:flex; 
  gap:clamp(8px, 1.5vw, 10px); 
  flex-wrap:wrap; 
}

/* botões primários */
.btn-primary-like{
  display:inline-flex; 
  align-items:center; 
  gap:clamp(6px, 1.5vw, 8px);
  border-radius:clamp(12px, 2.5vw, 14px); 
  border:1px solid rgba(255,255,255,.28); 
  color:#fff;
  font-weight:800; 
  letter-spacing:.2px; 
  padding:clamp(8px, 1.8vw, 10px) clamp(12px, 2.5vw, 14px);
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 12px 26px rgba(94,23,235,.30);
  transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
  cursor: pointer;
  text-decoration: none;
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  white-space: nowrap;
}

.btn-primary-like[disabled]{ opacity:.55; cursor:not-allowed; }
.btn-primary-like:hover:not([disabled]){ transform: translateY(-1px); filter: brightness(1.05); border-color: var(--surface-hover-border); box-shadow: 0 16px 32px rgba(94,23,235,.36); }
.btn-primary-like.alt{ background: linear-gradient(135deg, #7aebc6, #3cc7a8); box-shadow: 0 12px 26px rgba(60,199,168,.28); }
.btn-primary-like.alt:hover:not([disabled]){ box-shadow: 0 16px 32px rgba(60,199,168,.36); }

.btn-primary-like i {
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
}

/* botão perigo */
.btn-danger-like{
  display:inline-flex; 
  align-items:center; 
  gap:clamp(6px, 1.5vw, 8px);
  border-radius:clamp(12px, 2.5vw, 14px); 
  border:1px solid rgba(255,255,255,.30); 
  color:#fff;
  font-weight:800; 
  letter-spacing:.2px; 
  padding:clamp(8px, 1.8vw, 10px) clamp(12px, 2.5vw, 14px);
  background: linear-gradient(135deg, var(--danger), var(--danger-2));
  box-shadow: 0 12px 26px rgba(255,91,110,.28);
  transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
  cursor: pointer;
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  white-space: nowrap;
}

.btn-danger-like:hover{ transform: translateY(-1px); filter: brightness(1.05); border-color: rgba(255,255,255,.36); box-shadow: 0 16px 32px rgba(255,91,110,.36); }

.btn-danger-like i {
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
}

/* botão ghost mini (para "Perfil") */
.btn-ghost.mini{
  display:inline-flex; 
  align-items:center; 
  gap:clamp(4px, 1vw, 6px);
  border-radius:clamp(10px, 2vw, 12px); 
  border:1px solid rgba(255,255,255,.26); 
  color:#fff;
  padding:clamp(6px, 1.5vw, 8px) clamp(8px, 1.8vw, 10px); 
  font-weight:800; 
  letter-spacing:.2px;
  background: rgba(255,255,255,.10);
  transition: transform .12s ease, border-color .2s ease, box-shadow .25s ease, background .25s ease;
  margin-right: clamp(6px, 1.5vw, 8px);
  cursor: pointer;
  font-size: clamp(0.75rem, 1.6vw, 0.85rem);
  white-space: nowrap;
}

.btn-ghost.mini:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.34); background: rgba(255,255,255,.16); }

.btn-ghost.mini i {
  font-size: clamp(0.75rem, 1.6vw, 0.85rem);
}

/* ranking */
.chd-section{
  background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10));
  border:1px solid var(--surface-border);
  border-radius: clamp(16px, 3vw, 22px);
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
  padding:clamp(12px, 2.5vw, 16px);
}

.section-title{ 
  margin:0 0 clamp(8px, 1.8vw, 10px); 
  font-weight:800; 
  font-size: clamp(1.05rem, 2.2vw, 1.2rem);
}

.empty{ 
  display:grid; 
  place-items:center; 
  gap:clamp(4px, 1vw, 6px); 
  color:var(--text-soft); 
  padding:clamp(20px, 3vw, 24px); 
  border:1px dashed rgba(255,255,255,.24); 
  border-radius:clamp(12px, 2.5vw, 14px); 
}

.empty i{ 
  font-size:clamp(18px, 3.5vw, 22px); 
  opacity:.9; 
}

.empty p {
  font-size: clamp(0.9rem, 2vw, 1rem);
  margin: 0;
}

.rank-list{ 
  display:grid; 
  gap:clamp(8px, 1.5vw, 10px); 
}

/* Scroll otimizado para listas longas em telas 21:9 */
@supports (aspect-ratio: 9/19) {
  .rank-list {
    max-height: 65vh;
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .rank-list::-webkit-scrollbar {
    width: 6px;
  }

  .rank-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .rank-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
  }

  .rank-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
}

.rank-item{
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  gap:clamp(10px, 2vw, 12px);
  background: rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.24);
  border-radius: clamp(12px, 2.5vw, 16px);
  padding: clamp(8px, 1.8vw, 10px) clamp(10px, 2vw, 12px);
  width: 100%;
}

.rank-left{ 
  display:flex; 
  align-items:center; 
  gap:clamp(10px, 2vw, 12px);
  min-width: 0;
  flex: 1;
}

.pos{
  width:clamp(34px, 6vw, 38px); 
  height:clamp(34px, 6vw, 38px); 
  display:grid; 
  place-items:center; 
  border-radius:clamp(10px, 2vw, 12px);
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 8px 18px rgba(94,23,235,.28);
  font-weight:900;
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  flex-shrink: 0;
}

.info {
  min-width: 0;
  flex: 1;
}

.info .title{ 
  font-weight:800; 
  display:flex; 
  align-items:center; 
  gap:clamp(6px, 1.5vw, 8px);
  font-size: clamp(0.9rem, 2vw, 1rem);
  line-height: 1.3;
  word-break: break-word;
  flex-wrap: wrap;
}

.info .title .pill{
  font-size:clamp(0.65rem, 1.4vw, 0.72rem); 
  padding:clamp(0.15rem, 0.4vw, 0.2rem) clamp(0.4rem, 0.9vw, 0.5rem); 
  border-radius:999px;
  border:1px solid rgba(255,255,255,.26); 
  background: rgba(255,255,255,.14);
  text-transform:capitalize;
  white-space: nowrap;
}

.info .meta{ 
  font-size:clamp(0.8rem, 1.8vw, 0.92rem); 
  color:var(--text-soft);
  line-height: 1.4;
  word-break: break-word;
}

.info .autor-link{ 
  cursor:pointer; 
  text-decoration: underline; 
  text-underline-offset: 2px;
  color: #a78bfa;
  font-weight: 600;
  transition: color .2s ease;
}

.info .autor-link:hover{ 
  color: #c4b5fd;
  text-decoration-thickness: 2px;
}

.rank-right{ 
  display:flex; 
  align-items:center; 
  gap:clamp(6px, 1.5vw, 8px);
  flex-shrink: 0;
}

.loading {
  text-align: center;
  padding: clamp(32px, 5vw, 40px);
  color: var(--text-soft);
  font-size: clamp(0.95rem, 2vw, 1.05rem);
}

/* ===== MEDIA QUERIES RESPONSIVAS ===== */

/* Tablets */
@media (max-width: 768px) {
  .fy-container {
    padding-bottom: 80px;
  }

  .head-actions {
    gap: 8px;
  }

  .chd-meta {
    gap: 12px;
  }

  .rank-item {
    padding: 10px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .fy-container {
    padding: 16px 12px 60px;
  }

  .content-shell {
    padding: 14px 12px 16px;
    border-radius: 20px;
  }

  .chd-shell {
    gap: 16px;
  }

  .chd-head {
    gap: 10px;
  }

  .chd-badges {
    gap: 6px;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.3rem 0.55rem;
  }

  .chd-title {
    font-size: 1.25rem;
  }

  .chd-desc {
    font-size: 0.9rem;
  }

  .chd-meta {
    gap: 10px;
    font-size: 0.8rem;
  }

  .meta-item {
    gap: 6px;
  }

  .head-actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn-primary-like,
  .btn-danger-like {
    width: 100%;
    justify-content: center;
    padding: 10px 14px;
    font-size: 0.9rem;
  }

  .chd-section {
    padding: 12px;
    border-radius: 16px;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 8px;
  }

  .rank-list {
    gap: 8px;
  }

  .rank-item { 
    flex-direction: column; 
    align-items: stretch;
    padding: 10px;
  }

  .rank-left {
    gap: 10px;
  }

  .pos {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .info .title {
    font-size: 0.9rem;
    gap: 6px;
  }

  .info .title .pill {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }

  .info .meta {
    font-size: 0.8rem;
  }

  .rank-right { 
    justify-content: flex-start;
    margin-top: 4px;
  }

  .btn-ghost.mini {
    font-size: 0.8rem;
    padding: 6px 10px;
  }
}

/* Mobile pequeno */
@media (max-width: 380px) {
  .chd-title {
    font-size: 1.15rem;
  }

  .chd-desc {
    font-size: 0.85rem;
  }

  .chd-meta {
    font-size: 0.75rem;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
  }

  .btn-primary-like,
  .btn-danger-like {
    font-size: 0.85rem;
    padding: 9px 12px;
  }

  .section-title {
    font-size: 0.95rem;
  }

  .info .title {
    font-size: 0.85rem;
  }

  .info .meta {
    font-size: 0.75rem;
  }

  .btn-ghost.mini {
    font-size: 0.75rem;
    padding: 5px 8px;
  }

  .btn-ghost.mini span {
    display: none;
  }
}

/* ===== DISPOSITIVOS 21:9 VERTICAIS ===== */

@media (max-width: 450px) and (min-aspect-ratio: 9/19) {
  .fy-container {
    padding: 12px 10px 60px;
  }

  .content-shell {
    padding: 12px 10px 14px;
    border-radius: 16px;
  }

  .chd-shell {
    gap: 14px;
  }

  .chd-head {
    gap: 8px;
  }

  .chd-badges {
    gap: 5px;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
  }

  .chd-title {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }

  .chd-desc {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .chd-meta {
    gap: 8px;
    font-size: 0.75rem;
  }

  .meta-item {
    gap: 5px;
  }

  .meta-item i {
    font-size: 0.85rem;
  }

  .head-actions {
    gap: 6px;
    margin-top: 6px;
  }

  .btn-primary-like,
  .btn-danger-like {
    padding: 8px 12px;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  .chd-section {
    padding: 10px;
    border-radius: 14px;
  }

  .section-title {
    font-size: 0.95rem;
    margin-bottom: 8px;
  }

  .rank-list {
    gap: 6px;
  }

  .rank-item {
    padding: 8px;
    border-radius: 12px;
  }

  .rank-left {
    gap: 8px;
  }

  .pos {
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
    border-radius: 8px;
  }

  .info .title {
    font-size: 0.85rem;
    gap: 5px;
  }

  .info .title .pill {
    font-size: 0.6rem;
    padding: 0.1rem 0.35rem;
  }

  .info .meta {
    font-size: 0.75rem;
  }

  .rank-right {
    gap: 5px;
  }

  .btn-ghost.mini {
    font-size: 0.7rem;
    padding: 5px 8px;
    border-radius: 8px;
  }

  .btn-ghost.mini span {
    display: none;
  }
}

/* Dispositivos 21:9 muito estreitos */
@media (max-width: 360px) and (min-aspect-ratio: 9/19) {
  .fy-container {
    padding: 10px 8px 50px;
  }

  .content-shell {
    padding: 10px 8px 12px;
    border-radius: 14px;
  }

  .chd-title {
    font-size: 1rem;
  }

  .chd-desc {
    font-size: 0.8rem;
  }

  .chd-meta {
    font-size: 0.7rem;
  }

  .badge {
    font-size: 0.6rem;
    padding: 0.2rem 0.45rem;
  }

  .btn-primary-like,
  .btn-danger-like {
    padding: 7px 10px;
    font-size: 0.75rem;
  }

  .pos {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .info .title {
    font-size: 0.8rem;
  }

  .info .meta {
    font-size: 0.7rem;
  }
}

/* Landscape mobile */
@media (max-width: 900px) and (orientation: landscape) {
  .fy-container {
    padding-top: 12px;
    padding-bottom: 40px;
  }

  .chd-shell {
    gap: 16px;
  }

  .head-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .btn-primary-like,
  .btn-danger-like {
    width: auto;
  }
}

/* Altura limitada */
@media (max-height: 600px) {
  .fy-container {
    padding-top: 10px;
    padding-bottom: 30px;
  }

  .chd-shell {
    gap: 14px;
  }

  .rank-list {
    max-height: 50vh;
  }
}

@media (max-height: 500px) and (max-width: 900px) {
  .content-shell {
    padding: 12px 14px;
  }

  .chd-head {
    gap: 8px;
  }

  .chd-section {
    padding: 10px;
  }

  .rank-item {
    padding: 6px 8px;
  }
}
`;