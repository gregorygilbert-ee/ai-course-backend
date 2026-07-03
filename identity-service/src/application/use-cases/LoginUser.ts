import { UserRepository } from '../../ports/outbound/UserRepository';
import { PasswordHasher } from '../../ports/outbound/PasswordHasher';
import { TokenService } from '../../ports/outbound/TokenService';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  token: string;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokenService.sign({ sub: user.id, email: user.email });

    return { token };
  }
}
