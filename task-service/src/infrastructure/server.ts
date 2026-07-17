import 'dotenv/config';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { CreateTask, GetTasks, UpdateTask, DeleteTask } from '../application/use-cases/TaskUseCases';
import { PrismaTaskRepository } from '../adapters/persistence/PrismaTaskRepository';
import { InMemoryTaskRepository } from '../adapters/persistence/InMemoryTaskRepository';
import { TaskRepository } from '../ports/outbound/TaskRepository';
import { JwtTokenVerifier } from '../adapters/JwtTokenVerifier';
import { registerRoutes } from '../adapters/http/routes';

const taskRepository: TaskRepository = process.env.DATABASE_URL
  ? new PrismaTaskRepository(new PrismaClient())
  : new InMemoryTaskRepository();

const jwtSecret = process.env.JWT_SECRET ?? 'changeme-min-32-chars-for-production';
const port = parseInt(process.env.PORT ?? '3002', 10);

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Task Service API',
        description: 'Authenticated task CRUD',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  registerRoutes(app, {
    createTask: new CreateTask(taskRepository),
    getTasks: new GetTasks(taskRepository),
    updateTask: new UpdateTask(taskRepository),
    deleteTask: new DeleteTask(taskRepository),
    tokenVerifier: new JwtTokenVerifier(jwtSecret),
  });

  await app.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { app };
