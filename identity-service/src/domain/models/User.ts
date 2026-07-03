export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  id: string;
  email: string;
  passwordHash: string;
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new UserValidationError(`Invalid email address: ${email}`);
  }
}

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new UserValidationError('Password must be at least 8 characters');
  }
}
