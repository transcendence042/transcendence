import Fastify from 'fastify';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config({ path: './secrets/.env' });

const fastify = Fastify();

fastify.get('/healthz', async () => 'ok');

// Endpoint to anonymize a user (for demo, by id param)
fastify.post('/api/user/:id/anonymize', async (request, reply) => {
  const { id } = request.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return reply.code(404).send({ error: 'User not found' });

  db.prepare(`
    UPDATE users SET
      username = ?,
      email = ?,
      fullName = ?,
      address = '',
      phone = '',
      profilePicture = '',
      bio = '',
      birthdate = NULL,
      socialLinks = '',
      isAnonymized = 1
    WHERE id = ?
  `).run(
    `anon${id}`,
    `anon${id}@example.com`,
    'Anonymous',
    id
  );

  return { message: 'User data anonymized' };
});

// Minimal endpoint to create a user (for testing)
fastify.post('/api/user', async (request, reply) => {
  const { username, email, fullName } = request.body;
  const info = db.prepare(
    'INSERT INTO users (username, email, fullName) VALUES (?, ?, ?)'
  ).run(username, email, fullName);
  return { id: info.lastInsertRowid };
});

const PORT = process.env.PORT || 3000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Fastify backend listening on port ${PORT}`);
});