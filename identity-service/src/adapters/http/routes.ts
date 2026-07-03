import { FastifyInstance } from 'fastify';
import { RegisterUser, EmailAlreadyRegisteredError } from '../../application/use-cases/RegisterUser';
import { LoginUser, InvalidCredentialsError } from '../../application/use-cases/LoginUser';
import { GetAuthenticatedUser } from '../../application/use-cases/GetAuthenticatedUser';
import { JwtTokenService, InvalidTokenError } from '../JwtTokenService';

export function registerRoutes(
  app: FastifyInstance,
  deps: {
    registerUser: RegisterUser;
    loginUser: LoginUser;
    getAuthenticatedUser: GetAuthenticatedUser;
    tokenService: JwtTokenService;
  },
) {
  app.post('/register', async (request, reply) => {
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

  app.post('/login', async (request, reply) => {
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

  app.get('/me', async (request, reply) => {
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
