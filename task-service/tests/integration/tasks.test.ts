import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { CreateTask, GetTasks, UpdateTask, DeleteTask } from '../../src/application/use-cases/TaskUseCases';
import { InMemoryTaskRepository } from '../../src/adapters/persistence/InMemoryTaskRepository';
import { registerRoutes } from '../../src/adapters/http/routes';

const JWT_SECRET = 'test-secret-at-least-32-characters!!';
const USER_ID = 'test-user-uuid';
const token = jwt.sign({ sub: USER_ID, email: 'greg@example.com' }, JWT_SECRET, { expiresIn: '1h' });
const authHeader = `Bearer ${token}`;

function buildApp() {
  const repo = new InMemoryTaskRepository();
  const app = Fastify();
  registerRoutes(app, {
    createTask: new CreateTask(repo),
    getTasks: new GetTasks(repo),
    updateTask: new UpdateTask(repo),
    deleteTask: new DeleteTask(repo),
    jwtSecret: JWT_SECRET,
  });
  return app;
}

describe('Task Service — HTTP', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it('POST /tasks — creates a task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tasks',
      headers: { authorization: authHeader },
      payload: { title: 'Buy milk', description: 'From the shop' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().title).toBe('Buy milk');
    expect(res.json().userId).toBe(USER_ID);
  });

  it('GET /tasks — lists tasks for authenticated user', async () => {
    await app.inject({ method: 'POST', url: '/tasks', headers: { authorization: authHeader }, payload: { title: 'Task 1', description: '' } });
    await app.inject({ method: 'POST', url: '/tasks', headers: { authorization: authHeader }, payload: { title: 'Task 2', description: '' } });
    const res = await app.inject({ method: 'GET', url: '/tasks', headers: { authorization: authHeader } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('PUT /tasks/:id — updates a task', async () => {
    const created = (await app.inject({ method: 'POST', url: '/tasks', headers: { authorization: authHeader }, payload: { title: 'Original', description: '' } })).json();
    const res = await app.inject({
      method: 'PUT',
      url: `/tasks/${created.id}`,
      headers: { authorization: authHeader },
      payload: { title: 'Updated', isCompleted: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe('Updated');
    expect(res.json().isCompleted).toBe(true);
  });

  it('DELETE /tasks/:id — deletes a task', async () => {
    const created = (await app.inject({ method: 'POST', url: '/tasks', headers: { authorization: authHeader }, payload: { title: 'Delete me', description: '' } })).json();
    const res = await app.inject({ method: 'DELETE', url: `/tasks/${created.id}`, headers: { authorization: authHeader } });
    expect(res.statusCode).toBe(204);
  });

  it('GET /tasks — 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/tasks' });
    expect(res.statusCode).toBe(401);
  });

  it('PUT /tasks/:id — 404 for non-existent task', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/tasks/non-existent-id',
      headers: { authorization: authHeader },
      payload: { title: 'Ghost' },
    });
    expect(res.statusCode).toBe(404);
  });
});
