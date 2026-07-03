import { UserRepository } from '../../ports/outbound/UserRepository';

export interface GetAuthenticatedUserOutput {
  id: string;
  email: string;
  createdAt: Date;
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User not found: ${id}`);
    this.name = 'UserNotFoundError';
  }
}

export class GetAuthenticatedUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<GetAuthenticatedUserOutput> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
