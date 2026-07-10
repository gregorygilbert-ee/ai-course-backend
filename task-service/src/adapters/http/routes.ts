import { FastifyInstance } from 'fastify';
import { CreateTask, GetTasks, UpdateTask, DeleteTask, TaskNotFoundError } from '../../application/use-cases/TaskUseCases';
import { TokenVerifier } from '../../ports/outbound/TokenVerifier';
import { createAuthMiddleware } from './authMiddleware';

export function registerRoutes(
  app: FastifyInstance,
  deps: {
    createTask: CreateTask;
    getTasks: GetTasks;
    updateTask: UpdateTask;
    deleteTask: DeleteTask;
    tokenVerifier: TokenVerifier;
  },
) {
  const authMiddleware = createAuthMiddleware(deps.tokenVerifier);

  app.addHook('preHandler', authMiddleware);

  app.post('/tasks', async (request, reply) => {
    const userId = request.user!.id;
    const { title, description, dueDate } = request.body as {
      title: string;
      description: string;
      dueDate?: string;
    };
    const task = await deps.createTask.execute({
      userId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    return reply.status(201).send(task);
  });

  app.get('/tasks', async (request, reply) => {
    const tasks = await deps.getTasks.execute(request.user!.id);
    return reply.send(tasks);
  });

  app.put('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const body = request.body as {
      title?: string;
      description?: string;
      dueDate?: string | null;
      isCompleted?: boolean;
    };
    try {
      const task = await deps.updateTask.execute(id, userId, {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
      });
      return reply.send(task);
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deps.deleteTask.execute(id, request.user!.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof TaskNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  });
}
