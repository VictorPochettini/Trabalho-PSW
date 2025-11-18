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

  const currentUser = useSelector((s) => s.user?.currentUser);
  const usuarios = useSelector((s) => s.user?.usuarios || []);
  const posts = useSelector((s) => s.posts?.lista || []);

  const desafio = useSelector(selectDesafioById(id));
  const selectRanking = makeSelectRankingByStars(id);
  const ranking = useSelector(selectRanking);

  const isCreator = !!(currentUser && desafio && String(desafio.criadorId) === String(currentUser.id));
  const isAdmin = !!currentUser?.admin;
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
    try {
      await axios.patch(`http://localhost:5000/desafios/${id}`, {
        status: "publicado",
        updatedAt: new Date().toISOString(),
      });
      dispatch(fetchDesafioById(id));
    } catch (e) {
      console.error(e);
      alert("Não foi possível publicar o desafio.");
    }
  };

  const handleDelete = async () => {
    if (!canManage) return;
    if (!confirm("Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita.")) return;
    try {
      await axios.delete(`http://localhost:5000/desafios/${id}`);
      navigate("/desafios");
    } catch (e) {
      console.error(e);
      alert("Não foi possível excluir o desafio.");
    }
  };

  const findUserById = (uid) =>
    usuarios.find((u) => String(u.id) === String(uid));
  const findPostById = (pid) =>
    posts.find((p) => String(p.id) === String(pid));

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
                  const autor = post ? findUserById(post.usuarioId) : null;
                  const autorNome =
                    (autor?.nome && autor?.nome.trim()) ? autor.nome : (autor?.username ? `@${autor.username}` : "Autor");

                  return (
                    <div key={r.participacaoId} className="rank-item">
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

.fy-container{ max-width:1100px; margin:0 auto; padding:28px 20px 60px; color:var(--text-strong); background:transparent; }
.content-shell{
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
  border:1px solid var(--surface-border);
  border-radius: 28px;
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  box-shadow: var(--shadow-1), inset 0 1px 0 rgba(255,255,255,.22);
  padding: 18px 16px 20px;
}
.chd-shell{ display:grid; gap:22px; }
.chd-head{ display:grid; gap:12px; }
.chd-badges{ display:flex; gap:8px; flex-wrap:wrap; }
.badge{
  font-size:.78rem; padding:.4rem .65rem; border-radius:999px;
  border:1px solid rgba(255,255,255,.26); background: rgba(255,255,255,.14);
  text-transform:capitalize; letter-spacing:.2px;
}
.badge.tipo.oficial{ background:linear-gradient(135deg, rgba(99,102,241,.30), rgba(59,130,246,.26)); border-color:rgba(147,197,253,.45); }
.badge.tipo.comunidade{ background:linear-gradient(135deg, rgba(168,85,247。.30), rgba(236,72,153,.24)); border-color:rgba(232,121,249,.42); }
.badge.status.aberto{ background:rgba(34,197,94,.24); border-color:rgba(134,239,172,.45); }
.badge.status.encerrado{ background:rgba(148,163,184,.24); border-color:rgba(148,163,184,.45); }
.badge.status.rascunho{ background:rgba(255,214,102,.24); border-color:rgba(255,214,102,.45); }
.chd-title{ margin:0; font-weight:800; letter-spacing:.2px; font-size: clamp(22px, 2.2vw, 30px); text-shadow: 0 2px 14px rgba(0,0,0,.25); }
.chd-desc{ margin:0; color:var(--text-soft); }
.chd-meta{ display:flex; gap:14px; flex-wrap:wrap; color:var(--muted); }
.meta-item{ display:flex; gap:8px; align-items:center; }
.meta-item.clickable{ cursor:pointer; }
.head-actions{ margin-top:4px; display:flex; gap:10px; flex-wrap:wrap; }

/* botões primários */
.btn-primary-like{
  display:inline-flex; align-items:center; gap:8px;
  border-radius:14px; border:1px solid rgba(255,255,255,.28); color:#fff;
  font-weight:800; letter-spacing:.2px; padding:10px 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 12px 26px rgba(94,23,235,.30);
  transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
}
.btn-primary-like[disabled]{ opacity:.55; cursor:not-allowed; }
.btn-primary-like:hover{ transform: translateY(-1px); filter: brightness(1.05); border-color: var(--surface-hover-border); box-shadow: 0 16px 32px rgba(94,23,235,.36); }
.btn-primary-like.alt{ background: linear-gradient(135deg, #7aebc6, #3cc7a8); box-shadow: 0 12px 26px rgba(60,199,168,.28); }
.btn-primary-like.alt:hover{ box-shadow: 0 16px 32px rgba(60,199,168,.36); }

/* botão perigo */
.btn-danger-like{
  display:inline-flex; align-items:center; gap:8px;
  border-radius:14px; border:1px solid rgba(255,255,255,.30); color:#fff;
  font-weight:800; letter-spacing:.2px; padding:10px 14px;
  background: linear-gradient(135deg, var(--danger), var(--danger-2));
  box-shadow: 0 12px 26px rgba(255,91,110,.28);
  transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
}
.btn-danger-like:hover{ transform: translateY(-1px); filter: brightness(1.05); border-color: rgba(255,255,255,.36); box-shadow: 0 16px 32px rgba(255,91,110,.36); }

/* botão ghost mini (para "Perfil") */
.btn-ghost.mini{
  display:inline-flex; align-items:center; gap:6px;
  border-radius:12px; border:1px solid rgba(255,255,255,.26); color:#fff;
  padding:8px 10px; font-weight:800; letter-spacing:.2px;
  background: rgba(255,255,255,.10);
  transition: transform .12s ease, border-color .2s ease, box-shadow .25s ease, background .25s ease;
  margin-right: 8px;
}
.btn-ghost.mini:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.34); background: rgba(255,255,255,.16); }

/* ranking */
.chd-section{
  background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10));
  border:1px solid var(--surface-border);
  border-radius: 22px;
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
  padding:16px;
}
.section-title{ margin:0 0 10px; font-weight:800; }
.empty{ display:grid; place-items:center; gap:6px; color:var(--text-soft); padding:24px; border:1px dashed rgba(255,255,255,.24); border-radius:14px; }
.empty i{ font-size:22px; opacity:.9; }
.rank-list{ display:grid; gap:10px; }
.rank-item{
  display:flex; justify-content:space-between; align-items:center; gap:12px;
  background: rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.24);
  border-radius: 16px;
  padding: 10px 12px;
}
.rank-left{ display:flex; align-items:center; gap:12px; }
.pos{
  width:38px; height:38px; display:grid; place-items:center; border-radius:12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 8px 18px rgba(94,23,235,.28);
  font-weight:900;
}
.info .title{ font-weight:800; display:flex; align-items:center; gap:8px; }
.info .title .pill{
  font-size:.72rem; padding:.2rem .5rem; border-radius:999px;
  border:1px solid rgba(255,255,255,.26); background: rgba(255,255,255,.14);
  text-transform:capitalize;
}
.info .meta{ font-size:.92rem; color:var(--text-soft); }
.info .autor-link{ cursor:pointer; text-decoration: underline; text-underline-offset: 2px; }
.rank-right{ display:flex; align-items:center; gap:8px; }
@media (max-width:640px){
  .rank-item{ flex-direction:column; align-items:stretch; }
  .rank-right{ justify-content:flex-start; }
}
`;
