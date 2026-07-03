import * as argon2 from 'argon2';
import { PasswordHasher } from '../ports/outbound/PasswordHasher';

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext);
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plaintext);
  }
}
