import { User, CreateUserInput } from '../../domain/models/User';
import { UserRepository } from '../../ports/outbound/UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  clear(): void {
    this.users.clear();
  }
}
