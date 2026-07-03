import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUser, EmailAlreadyRegisteredError } from '../../src/application/use-cases/RegisterUser';
import { InMemoryUserRepository } from '../../src/adapters/persistence/InMemoryUserRepository';
import { UserValidationError } from '../../src/domain/models/User';

class FakePasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return `hashed:${plaintext}`;
  }
  async verify(plaintext: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plaintext}`;
  }
}

describe('RegisterUser', () => {
  let repo: InMemoryUserRepository;
  let useCase: RegisterUser;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new RegisterUser(repo, new FakePasswordHasher());
  });

  it('registers a new user and returns id and email', async () => {
    const result = await useCase.execute({ email: 'greg@example.com', password: 'securepass' });
    expect(result.email).toBe('greg@example.com');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('hashes the password before storing', async () => {
    await useCase.execute({ email: 'greg@example.com', password: 'securepass' });
    const stored = await repo.findByEmail('greg@example.com');
    expect(stored?.passwordHash).toBe('hashed:securepass');
    expect(stored?.passwordHash).not.toBe('securepass');
  });

  it('throws if email is already registered', async () => {
    await useCase.execute({ email: 'greg@example.com', password: 'securepass' });
    await expect(
      useCase.execute({ email: 'greg@example.com', password: 'otherpass' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });

  it('throws on invalid email format', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', password: 'securepass' }),
    ).rejects.toThrow(UserValidationError);
  });

  it('throws if password is shorter than 8 characters', async () => {
    await expect(
      useCase.execute({ email: 'greg@example.com', password: 'short' }),
    ).rejects.toThrow(UserValidationError);
  });
});
