import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
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
  },
  apis: [
    join(__dirname, 'server.js'),  // Caminho absoluto
    './server.js',                  // Caminho relativo também
    './models/*.js',                // Incluir modelos se necessário
    './server/utils/*.js',         // Incluir utilitários se necessário
  ],
};

console.log('🔍 Tentando ler de:', join(__dirname, 'server.js'));

const swaggerDocument = swaggerJsdoc(options);

console.log('📦 Spec gerada!');
console.log('🛣️  Paths encontrados:', Object.keys(swaggerDocument.paths || {}).length);
console.log('📋 Lista de paths:', Object.keys(swaggerDocument.paths || {}));

export default swaggerDocument;