import 'dotenv/config';
import Fastify from 'fastify';
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

registerRoutes(app, { registerUser, loginUser, getAuthenticatedUser, tokenService });

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export { app };
