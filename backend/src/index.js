const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const buildResolvers = require('./resolvers');

function getCorsOptions() {
  // Production: set FRONTEND_URL to the deployed Vercel URL
  // (comma-separated if more than one). Local dev: leave unset for open CORS.
  const raw = process.env.FRONTEND_URL;
  if (!raw) return undefined;
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (origins.length === 0) return undefined;
  return { origin: origins.length === 1 ? origins[0] : origins };
}

function createApp(prisma) {
  const app = express();
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, status: 'ok' });
  });

  // Lazy prisma require so tests can inject a mock without needing a DB
  const db = prisma || require('./prisma');
  app.locals.prisma = db;
  app.locals.resolvers = buildResolvers(db);

  return app;
}

async function startServer() {
  require('dotenv').config();
  const prisma = require('./prisma');
  const app = createApp(prisma);

  const server = new ApolloServer({
    typeDefs,
    resolvers: app.locals.resolvers,
    formatError: (err) => ({
      message: err.message,
      code: err.extensions && err.extensions.code,
    }),
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql', cors: getCorsOptions() || true });

  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend ready at http://localhost:${port}/graphql (health: /health)`);
  });
  return app;
}

if (require.main === module) {
  startServer().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { createApp, startServer };
