// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importe seu CSS global
import 'bootstrap/dist/css/bootstrap.min.css'; // Importe o CSS do Bootstrap
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);