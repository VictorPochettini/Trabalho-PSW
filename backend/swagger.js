// swagger-simple.js - Versão que FUNCIONA
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ArtBeat API',
    version: '1.0.0',
    description: 'API para a plataforma ArtBeat',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor de desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    { name: 'Sistema', description: 'Endpoints do sistema' },
    { name: 'Usuarios', description: 'Gerenciamento de usuários' },
    { name: 'Posts', description: 'Gerenciamento de posts' },
    { name: 'Desafios', description: 'Gerenciamento de desafios' },
    { name: 'Participacoes', description: 'Participações em desafios' },
    { name: 'Comentarios', description: 'Comentários em posts' },
    { name: 'Seguidores', description: 'Sistema de seguidores' },
    { name: 'Avaliacoes', description: 'Avaliações de posts' },
  ],
};

export default swaggerDocument;