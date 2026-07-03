import { User, CreateUserInput } from '../../domain/models/User';

export interface UserRepository {
  save(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
