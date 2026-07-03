import { v4 as uuidv4 } from 'uuid';
import { validateEmail, validatePassword } from '../../domain/models/User';
import { UserRepository } from '../../ports/outbound/UserRepository';
import { PasswordHasher } from '../../ports/outbound/PasswordHasher';

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  email: string;
  createdAt: Date;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    validateEmail(input.email);
    validatePassword(input.password);

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(input.email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.save({
      id: uuidv4(),
      email: input.email,
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
