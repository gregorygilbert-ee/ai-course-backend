import { FastifyInstance } from 'fastify';
import { RegisterUser, EmailAlreadyRegisteredError } from '../../application/use-cases/RegisterUser';
import { LoginUser, InvalidCredentialsError } from '../../application/use-cases/LoginUser';
import { GetAuthenticatedUser } from '../../application/use-cases/GetAuthenticatedUser';
import { JwtTokenService, InvalidTokenError } from '../JwtTokenService';

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
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
    registerUser: RegisterUser;
    loginUser: LoginUser;
    getAuthenticatedUser: GetAuthenticatedUser;
    tokenService: JwtTokenService;
  },
) {
  app.post('/register', {
    schema: {
      summary: 'Register a new user',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        201: userSchema,
        409: errorSchema,
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    try {
      const result = await deps.registerUser.execute({ email, password });
      return reply.status(201).send(result);
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        return reply.status(409).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/login', {
    schema: {
      summary: 'Login and receive a JWT',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    try {
      const result = await deps.loginUser.execute({ email, password });
      return reply.send(result);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/me', {
    schema: {
      summary: 'Get the authenticated user',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: userSchema,
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.slice(7);
    try {
      const payload = deps.tokenService.verify(token);
      const user = await deps.getAuthenticatedUser.execute(payload.sub);
      return reply.send(user);
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });
}
