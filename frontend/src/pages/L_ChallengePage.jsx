import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDesafios } from "../redux/desafiosSlice";
import { useNavigate } from "react-router-dom";
import HeaderForYou from "../components/Header2";

export default function ChallengesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const desafios = useSelector((s) => s.desafios.lista || []);
  const loadingDesafios = useSelector((s) => s.desafios.loading);

  // novo formato: currentUserState = { user, token }
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;

  const [activeTab, setActiveTab] = useState("oficiais");
  const [sortBy, setSortBy] = useState("recentes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { dispatch(fetchDesafios()); }, [dispatch]);

  const matchesTab = (d) => {
    if (activeTab === "oficiais") return d.tipo === "oficial" && d.status !== "rascunho";
    if (activeTab === "comunidade") return d.tipo === "comunidade" && d.status !== "rascunho";
    if (activeTab === "meus") return d.tipo === "comunidade" && String(d.criadorId) === String(currentUserId);
    return true;
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setIsSearching(!!term.trim());
  };

  // ===== Helpers para status derivado "finalizado" quando dataFim já passou =====
  const toTime = (v) => (v ? new Date(v).getTime() : 0);
  const isExpired = (d) => (d?.dataFim ? toTime(d.dataFim) < Date.now() : false);
  const getDerivedStatus = (d) => (isExpired(d) ? "finalizado" : (d.status || "aberto"));

  const filteredAndSorted = useMemo(() => {
    let list = desafios.filter(matchesTab);
    if (isSearching) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          String(d.titulo || "").toLowerCase().includes(term) ||
          String(d.descricao || "").toLowerCase().includes(term)
      );
    }
    const now = Date.now();
    const sorted = [...list];
    if (sortBy === "recentes") {
      sorted.sort((a, b) => toTime(b.dataInicio) - toTime(a.dataInicio) || String(b.id).localeCompare(String(a.id)));
    } else if (sortBy === "proximos") {
      sorted.sort((a, b) => (toTime(a.dataFim) - now) - (toTime(b.dataFim) - now));
    } else if (sortBy === "encerrados") {
      const closed = (x) => {
        const s = getDerivedStatus(x);
        return s === "finalizado" || s === "encerrado";
      };
      // Primeiro os encerrados/finalizados, depois por dataFim mais recente
      sorted.sort((a, b) => (closed(b) - closed(a)) || toTime(b.dataFim) - toTime(a.dataFim));
    }
    return sorted;
  }, [desafios, activeTab, sortBy, isSearching, searchTerm, currentUserId]);

  const loading = loadingDesafios;

  // Usa o status derivado para classe; "finalizado" herda o estilo de "encerrado"
  const statusBadgeClass = (d) => {
    const s = getDerivedStatus(d);
    const isClosed = s === "finalizado" || s === "encerrado";
    return `ch-badge status ${isClosed ? "encerrado" : "aberto"}`;
  };
  const tipoBadgeClass  = (d) => `ch-badge ${d.tipo === "oficial" ? "oficial" : "comunidade"}`;

  return (
    <>
      <HeaderForYou />

      <div className="fy-container">
        <h1 className="fy-title">Desafios em Destaque</h1>
        <p className="fy-subtitle">Participe dos desafios <b>oficiais</b> e da <b>comunidade</b>, mostre sua arte e suba no ranking ⭐</p>

        {/* casca translúcida clara */}
        <div className="content-shell">
          {/* busca */}
          <div className="fy-search-container">
            <div className="fy-search-box">
              <i className="fas fa-search fy-search-icon"></i>
              <input
                type="text"
                className="fy-search-input"
                placeholder="Pesquisar desafios por título ou descrição..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <button className="fy-search-clear" onClick={() => handleSearch("")}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {isSearching && (
              <div className="fy-search-results-info">
                <span>{filteredAndSorted.length} resultado(s) para "{searchTerm}"</span>
                <button className="fy-search-clear-btn" onClick={() => handleSearch("")}>Limpar pesquisa</button>
              </div>
            )}
          </div>

          {/* filtros + ordenação + CRIAR DESAFIO */}
          <div className="fy-filters">
            <div className="fy-filter-buttons">
              <button className={`fy-filter-btn ${activeTab === "oficiais" ? "active" : ""}`} onClick={() => setActiveTab("oficiais")}>Oficiais</button>
              <button className={`fy-filter-btn ${activeTab === "comunidade" ? "active" : ""}`} onClick={() => setActiveTab("comunidade")}>Comunidade</button>
              <button className={`fy-filter-btn ${activeTab === "meus" ? "active" : ""}`} onClick={() => setActiveTab("meus")} disabled={!currentUser}>Meus</button>
            </div>

            <div className="right-tools">
              <div className="fy-sort">
                <label htmlFor="sort-by">Ordenar por:</label>
                <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="recentes">Mais Recentes</option>
                  <option value="proximos">Encerrando em breve</option>
                  <option value="encerrados">Encerrados</option>
                </select>
              </div>

              {/* ➕ Botão Criar Desafio (comunidade) */}
              <button
                className="ch-create-btn"
                onClick={() => navigate("/desafios/criar")}
                disabled={!currentUser}
                title={currentUser ? "Criar desafio da comunidade" : "Faça login para criar um desafio"}
              >
                <i className="fa-solid fa-plus"></i>
                <span>Criar desafio</span>
              </button>
            </div>
          </div>

          {/* grid */}
          {loading ? (
            <div className="fy-loading">Carregando…</div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="fy-no-results">
              <i className="fas fa-search fa-3x mb-3"></i>
              <h4>{isSearching ? `Nenhum desafio encontrado para "${searchTerm}"` : "Nenhum desafio disponível no momento"}</h4>
              <p>{isSearching ? "Tente outros termos de pesquisa." : "Volte mais tarde para novas oportunidades!"}</p>
            </div>
          ) : (
            <div className="fy-grid">
              {filteredAndSorted.map((d) => (
                <div key={d.id} className="ch-card">
                  {d.thumbUrl && (
                    <div className="ch-thumb">
                      <img src={d.thumbUrl} alt="" loading="lazy" />
                    </div>
                  )}

                  <div className="ch-info">
                    <div className="ch-badges">
                      <span className={tipoBadgeClass(d)}>{d.tipo}</span>
                      {/* Usa o status derivado aqui */}
                      <span className={statusBadgeClass(d)}>{getDerivedStatus(d)}</span>
                    </div>

                    <h3 className="ch-title">{d.titulo}</h3>
                    <p className="ch-desc">{d.descricao}</p>

                    <div className="ch-meta">
                      {d.dataInicio && (
                        <div className="ch-meta-item">
                          <i className="fa-regular fa-calendar"></i>
                          <span>Início: {new Date(d.dataInicio).toLocaleDateString()}</span>
                        </div>
                      )}
                      {d.dataFim && (
                        <div className="ch-meta-item">
                          <i className="fa-regular fa-hourglass-half"></i>
                          <span>Fim: {new Date(d.dataFim).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="ch-actions">
                      <button className="fy-btn-follow ch-cta" onClick={() => navigate(`/desafios/${d._id}`)}>Ver desafio</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* estilos */}
      <style>{` /* mantive exatamente os mesmos estilos visuais */
        :root{ --accent:#5e17eb; --accent-2:#7b3ff2; --surface-border: rgba(255,255,255,0.16); --surface-hover-border: rgba(255,255,255,0.26); --text-strong:#f7f8ff; --text-soft:rgba(255,255,255,.9); --muted:rgba(255,255,255,.72); --shadow-1:0 10px 24px rgba(0,0,0,.20); --shadow-2:0 18px 40px rgba(0,0,0,.28);} 
        .fy-container{ max-width:1100px; margin:0 auto; padding:28px 20px 60px; color:var(--text-strong); background:transparent; }
        .fy-title{ margin:8px 0 6px; font-weight:800; letter-spacing:.2px; font-size:clamp(26px,2.4vw,34px); background:linear-gradient(90deg,#fff,#e9eaff 50%,#d4d9ff 85%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; text-shadow:0 2px 16px rgba(0,0,0,.25);} 
        .fy-subtitle{ margin:0 0 18px; color:var(--text-soft); text-shadow:0 1px 10px rgba(0,0,0,.20);} 
        .content-shell{ background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10)); border:1px solid rgba(255,255,255,.22); border-radius: 28px; backdrop-filter: blur(18px) saturate(1.15); -webkit-backdrop-filter: blur(18px) saturate(1.15); box-shadow: var(--shadow-1), inset 0 1px 0 rgba(255,255,255,.22); padding: 18px 16px 20px; } 
        .fy-search-container{ max-width:700px; margin:6px auto 18px; } .fy-search-box{ display:flex; align-items:center; background: rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.28); border-radius: 22px; padding:12px 16px; backdrop-filter: blur(14px); transition:all .25s ease; box-shadow: 0 8px 20px rgba(0,0,0,.15);} 
        .fy-search-box:focus-within{ border-color:rgba(255,255,255,.38); box-shadow: 0 10px 26px rgba(0,0,0,.20); } .fy-search-icon{ color:var(--muted); margin-right:12px; font-size:1.1rem; } .fy-search-input{ flex:1; border:none; background:transparent; color:#fff; font-size:1rem; outline:none; } .fy-search-input::placeholder{ color:rgba(255,255,255,.7); } .fy-search-clear{ background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.26); color:#fff; cursor:pointer; padding:6px; border-radius:10px; transition:all .2s ease; } .fy-search-clear:hover{ background:rgba(255,255,255,.18); } .fy-search-results-info{ display:flex; align-items:center; justify-content:center; gap:10px; margin-top:10px; color:var(--text-soft); } .fy-search-clear-btn{ background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.24); color:#fff; padding:6px 12px; border-radius:12px; font-size:.9rem; cursor:pointer; transition:all .2s ease; } .fy-search-clear-btn:hover{ background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.30); } 
        .fy-filters{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:14px; margin-bottom:16px; } .fy-filter-buttons{ display:flex; flex-wrap:wrap; gap:10px; } .fy-filter-btn{ border:1px solid rgba(255,255,255,.22); color:#fff; background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10)); padding:10px 18px; border-radius: 999px; font-weight:700; letter-spacing:.2px; backdrop-filter: blur(10px); transition: transform .15s ease, border-color .2s ease, box-shadow .25s ease, background .25s ease; } .fy-filter-btn:hover{ transform:translateY(-1px); border-color:rgba(255,255,255,.30); background:linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.12)); box-shadow: 0 12px 28px rgba(0,0,0,.20); } .fy-filter-btn.active{ background:linear-gradient(135deg, var(--accent), var(--accent-2)); border-color:rgba(255,255,255,.28); box-shadow:0 12px 26px rgba(94,23,235,.32); } .fy-filter-btn:disabled{ opacity:.55; cursor:not-allowed; } 
        .right-tools{ display:flex; align-items:center; gap:12px; } .fy-sort{ display:flex; align-items:center; gap:10px; color:var(--text-soft); font-weight:700; } .fy-sort select{ background: rgba(255,255,255,.14); color:#fff; border:1px solid rgba(255,255,255,.26); border-radius:14px; padding:8px 12px; outline:none; box-shadow: 0 8px 18px rgba(0,0,0,.14); } 
        .ch-create-btn{ display:inline-flex; align-items:center; gap:8px; border-radius:14px; border:1px solid rgba(255,255,255,.28); color:#fff; font-weight:800; letter-spacing:.2px; padding:10px 12px; background:linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow:0 12px 26px rgba(94,23,235,.28); transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease; cursor:pointer; } .ch-create-btn:hover{ transform:translateY(-1px); filter:brightness(1.05); border-color:rgba(255,255,255,.34); box-shadow:0 16px 32px rgba(94,23,235,.36); } .ch-create-btn:disabled{ opacity:.55; cursor:not-allowed; } 
        .fy-loading{ color:var(--text-soft); } .fy-no-results{ background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.24); border-radius: 22px; padding:40px 20px; backdrop-filter: blur(14px); text-align:center; color:var(--text-soft); } .fy-no-results h4{ color:#fff; margin-bottom:10px; } 
        .fy-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px; } .ch-card{ display:grid; grid-template-rows:auto 1fr; background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10)); color:#fff; border:1px solid rgba(255,255,255,.22); border-radius: 22px; box-shadow: var(--shadow-1); backdrop-filter: blur(14px) saturate(1.08); overflow:hidden; transition: transform .18s ease, box-shadow .25s ease, border-color .22s ease; } .ch-card:hover{ transform:translateY(-2px); box-shadow: var(--shadow-2); border-color: var(--surface-hover-border); } .ch-thumb{ position:relative; aspect-ratio:16/9; overflow:hidden; } .ch-thumb img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; } .ch-card:hover .ch-thumb img{ transform:scale(1.04); } 
        .ch-info{ padding:14px 14px 16px; display:grid; gap:10px; } .ch-badges{ display:flex; gap:8px; flex-wrap:wrap; } .ch-badge{ font-size:.72rem; padding:.35rem .6rem; border-radius:999px; border:1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.14); letter-spacing:.2px; text-transform:capitalize; } .ch-badge.oficial{ background:linear-gradient(135deg, rgba(99,102,241,.30), rgba(59,130,246,.26)); border-color:rgba(147,197,253,.45); } .ch-badge.comunidade{ background:linear-gradient(135deg, rgba(168,85,247,.28), rgba(236,72,153,.24)); border-color:rgba(232,121,249,.42); } .ch-badge.status.aberto{ background:rgba(34,197,94,.24); border-color:rgba(134,239,172,.45); } .ch-badge.status.encerrado{ background:rgba(148,163,184,.24); border-color:rgba(148,163,184,.45); } 
        .ch-title{ font-weight:800; margin:2px 0 0; } .ch-desc{ margin:0; color:rgba(255,255,255,.92); min-height:2.6em; } .ch-meta{ display:flex; gap:14px; flex-wrap:wrap; color:rgba(255,255,255,.85); } .ch-meta-item{ display:flex; align-items:center; gap:8px; } .ch-actions{ display:flex; justify-content:flex-end; } .ch-cta{ border-radius:14px; border:1px solid rgba(255,255,255,.28); color:#fff; font-weight:800; letter-spacing:.2px; padding:10px 12px; background:linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow:0 12px 26px rgba(94,23,235,.28); transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease; cursor:pointer; } .ch-cta:hover{ transform:translateY(-1px); filter:brightness(1.05); border-color:rgba(255,255,255,.34); box-shadow:0 16px 32px rgba(94,23,235,.36); } 
        @media (max-width:640px){ .fy-filters{ grid-template-columns:1fr; gap:12px; } .right-tools{ justify-content:space-between; } .fy-search-container{ margin-bottom:12px; } .ch-meta{ gap:8px; } }
      `}</style>
    </>
  );
}
