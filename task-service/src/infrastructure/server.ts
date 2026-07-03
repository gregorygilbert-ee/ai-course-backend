import 'dotenv/config';
import Fastify from 'fastify';
import { CreateTask, GetTasks, UpdateTask, DeleteTask } from '../application/use-cases/TaskUseCases';
import { InMemoryTaskRepository } from '../adapters/persistence/InMemoryTaskRepository';
import { registerRoutes } from '../adapters/http/routes';

// TODO: Replace InMemoryTaskRepository with PrismaTaskRepository when DB is ready
const taskRepository = new InMemoryTaskRepository();

const jwtSecret = process.env.JWT_SECRET ?? 'changeme-min-32-chars-for-production';
const port = parseInt(process.env.PORT ?? '3002', 10);

const app = Fastify({ logger: true });

registerRoutes(app, {
  createTask: new CreateTask(taskRepository),
  getTasks: new GetTasks(taskRepository),
  updateTask: new UpdateTask(taskRepository),
  deleteTask: new DeleteTask(taskRepository),
  jwtSecret,
});

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export { app };
