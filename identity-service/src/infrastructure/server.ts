import 'dotenv/config';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { RegisterUser } from '../application/use-cases/RegisterUser';
import { LoginUser } from '../application/use-cases/LoginUser';
import { GetAuthenticatedUser } from '../application/use-cases/GetAuthenticatedUser';
import { Argon2PasswordHasher } from '../adapters/Argon2PasswordHasher';
import { JwtTokenService } from '../adapters/JwtTokenService';
import { PrismaUserRepository } from '../adapters/persistence/PrismaUserRepository';
import { InMemoryUserRepository } from '../adapters/persistence/InMemoryUserRepository';
import { UserRepository } from '../ports/outbound/UserRepository';
import { registerRoutes } from '../adapters/http/routes';

const userRepository: UserRepository = process.env.DATABASE_URL
  ? new PrismaUserRepository(new PrismaClient())
  : new InMemoryUserRepository();

const jwtSecret = process.env.JWT_SECRET ?? 'changeme-min-32-chars-for-production';
const jwtExpiry = process.env.JWT_EXPIRY ?? '1h';
const port = parseInt(process.env.PORT ?? '3001', 10);

const passwordHasher = new Argon2PasswordHasher();
const tokenService = new JwtTokenService(jwtSecret, jwtExpiry);

const registerUser = new RegisterUser(userRepository, passwordHasher);
const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);
const getAuthenticatedUser = new GetAuthenticatedUser(userRepository);

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Identity Service API',
        description: 'User registration, login, and JWT issuance',
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
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  registerRoutes(app, { registerUser, loginUser, getAuthenticatedUser, tokenService });

  await app.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { app };
