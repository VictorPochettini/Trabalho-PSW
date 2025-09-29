// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import UserProfile from './pages/UserProfile';
import './index.css';
import InitialPage from './pages/InitialPage';
import ArtistsPage from './pages/ArtistsPage';
import ChallengePage from './pages/ChallengePage';

function App() {
  return (
    <Router>
      {/*<div className="App">*/}
        <Routes>
          {/*<Route path="/" element={<InitialPage />} />
          <Route path="/artistas" element={<ArtistsPage />} />
          <Route path="/desafios" element={<ChallengePage />} />*/}

          <Route path="/" element={<FeedPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      {/*</div>*/}
    </Router>
  );
}

export default App;