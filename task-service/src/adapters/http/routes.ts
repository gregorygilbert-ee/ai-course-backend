import { FastifyInstance } from 'fastify';
import { CreateTask, GetTasks, UpdateTask, DeleteTask, TaskNotFoundError } from '../../application/use-cases/TaskUseCases';
import { TokenVerifier } from '../../ports/outbound/TokenVerifier';
import { createAuthMiddleware } from './authMiddleware';

const taskSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    dueDate: { type: 'string', format: 'date-time', nullable: true },
    isCompleted: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};

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

  app.post('/tasks', {
    schema: {
      summary: 'Create a task',
      tags: ['Tasks'],
      body: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', maxLength: 255 },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: taskSchema,
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
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

  app.get('/tasks', {
    schema: {
      summary: 'List all tasks for the authenticated user',
      tags: ['Tasks'],
      response: {
        200: { type: 'array', items: taskSchema },
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
    const tasks = await deps.getTasks.execute(request.user!.id);
    return reply.send(tasks);
  });

  app.put('/tasks/:id', {
    schema: {
      summary: 'Update a task',
      tags: ['Tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 255 },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          isCompleted: { type: 'boolean' },
        },
      },
      response: {
        200: taskSchema,
        401: errorSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
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

  app.delete('/tasks/:id', {
    schema: {
      summary: 'Delete a task',
      tags: ['Tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        204: { type: 'null' },
        401: errorSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
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
