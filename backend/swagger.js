// swagger.js - ES Modules
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ArtBeat API',
      version: '1.0.0',
      description: `
        API completa do ArtBeat - plataforma de compartilhamento de arte.
        
        ## Recursos principais:
        - 🔐 Autenticação JWT (login, registro, refresh token)
        - 👤 Gerenciamento de usuários e perfis
        - 📝 Posts (imagem/áudio) com upload de mídia
        - 🏆 Desafios criativos
        - 💬 Comentários e respostas aninhadas
        - ⭐ Sistema de avaliações (1-5 estrelas)
        - 👥 Sistema de seguidores
        - 🎯 Participações em desafios
        
        ## Autenticação
        A maioria dos endpoints requer autenticação via JWT Bearer token.
        Use o endpoint \`POST /api/auth/login\` para obter um token.
      `,
      contact: {
        name: 'Victor Pochettini',
        email: 'vpochettini@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Servidor de desenvolvimento local'
      },
      {
        url: 'https://artbeat-api.exemplo.com',
        description: 'Servidor de produção (exemplo)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via POST /api/auth/login'
        }
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação (registro, login, logout, refresh)'
      },
      {
        name: 'Usuarios',
        description: 'Gerenciamento de usuários e perfis'
      },
      {
        name: 'Posts',
        description: 'Criação e gerenciamento de posts (arte)'
      },
      {
        name: 'Desafios',
        description: 'Desafios criativos para a comunidade'
      },
      {
        name: 'Comentarios',
        description: 'Sistema de comentários com respostas aninhadas'
      },
      {
        name: 'Avaliacoes',
        description: 'Sistema de avaliação por estrelas (1-5)'
      },
      {
        name: 'Seguidores',
        description: 'Sistema de follow/unfollow entre usuários'
      },
      {
        name: 'Participacoes',
        description: 'Submissões de posts para desafios'
      }
    ]
  },

  apis: [
  './server.js',                   
  './server/routes/*.js',          
  './server/middleware/auth.js',   
  './models/*.js',  
  './utils/tokens.js'              
]
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };