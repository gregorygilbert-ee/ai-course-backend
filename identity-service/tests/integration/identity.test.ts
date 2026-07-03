import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { RegisterUser } from '../../src/application/use-cases/RegisterUser';
import { LoginUser } from '../../src/application/use-cases/LoginUser';
import { GetAuthenticatedUser } from '../../src/application/use-cases/GetAuthenticatedUser';
import { Argon2PasswordHasher } from '../../src/adapters/Argon2PasswordHasher';
import { JwtTokenService } from '../../src/adapters/JwtTokenService';
import { InMemoryUserRepository } from '../../src/adapters/persistence/InMemoryUserRepository';
import { registerRoutes } from '../../src/adapters/http/routes';

function buildApp() {
  const repo = new InMemoryUserRepository();
  const hasher = new Argon2PasswordHasher();
  const tokenService = new JwtTokenService('test-secret-at-least-32-characters', '1h');
  const app = Fastify();
  registerRoutes(app, {
    registerUser: new RegisterUser(repo, hasher),
    loginUser: new LoginUser(repo, hasher, tokenService),
    getAuthenticatedUser: new GetAuthenticatedUser(repo),
    tokenService,
  });
  return app;
}

describe('Identity Service — HTTP', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it('POST /register — creates a user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'greg@example.com', password: 'securepass' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.email).toBe('greg@example.com');
    expect(body.id).toBeDefined();
  });

  it('POST /register — 409 on duplicate email', async () => {
    await app.inject({ method: 'POST', url: '/register', payload: { email: 'greg@example.com', password: 'securepass' } });
    const res = await app.inject({ method: 'POST', url: '/register', payload: { email: 'greg@example.com', password: 'securepass' } });
    expect(res.statusCode).toBe(409);
  });

  it('POST /login — returns JWT token', async () => {
    await app.inject({ method: 'POST', url: '/register', payload: { email: 'greg@example.com', password: 'securepass' } });
    const res = await app.inject({ method: 'POST', url: '/login', payload: { email: 'greg@example.com', password: 'securepass' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeDefined();
  });

  it('POST /login — 401 on wrong password', async () => {
    await app.inject({ method: 'POST', url: '/register', payload: { email: 'greg@example.com', password: 'securepass' } });
    const res = await app.inject({ method: 'POST', url: '/login', payload: { email: 'greg@example.com', password: 'wrongpass' } });
    expect(res.statusCode).toBe(401);
  });

  it('GET /me — returns user info with valid token', async () => {
    await app.inject({ method: 'POST', url: '/register', payload: { email: 'greg@example.com', password: 'securepass' } });
    const loginRes = await app.inject({ method: 'POST', url: '/login', payload: { email: 'greg@example.com', password: 'securepass' } });
    const { token } = loginRes.json();

    const res = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe('greg@example.com');
  });

  it('GET /me — 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });
});
