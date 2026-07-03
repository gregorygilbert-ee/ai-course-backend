import { describe, it, expect, beforeEach } from 'vitest';
import { LoginUser, InvalidCredentialsError } from '../../src/application/use-cases/LoginUser';
import { InMemoryUserRepository } from '../../src/adapters/persistence/InMemoryUserRepository';
import { v4 as uuidv4 } from 'uuid';

class FakePasswordHasher {
  async hash(p: string) { return `hashed:${p}`; }
  async verify(p: string, h: string) { return h === `hashed:${p}`; }
}

class FakeTokenService {
  sign(payload: { sub: string; email: string }) { return `token:${payload.sub}`; }
  verify(token: string) {
    const sub = token.replace('token:', '');
    return { sub, email: '' };
  }
}

describe('LoginUser', () => {
  let repo: InMemoryUserRepository;
  let useCase: LoginUser;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    await repo.save({
      id: uuidv4(),
      email: 'greg@example.com',
      passwordHash: 'hashed:securepass',
    });
    useCase = new LoginUser(repo, new FakePasswordHasher(), new FakeTokenService());
  });

  it('returns a token for valid credentials', async () => {
    const result = await useCase.execute({ email: 'greg@example.com', password: 'securepass' });
    expect(result.token).toContain('token:');
  });

  it('throws InvalidCredentialsError for wrong password', async () => {
    await expect(
      useCase.execute({ email: 'greg@example.com', password: 'wrongpass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for unknown email', async () => {
    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'securepass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
