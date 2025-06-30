import * as bcrypt from 'bcrypt';

export class HashUtil {
  static async hash(plainText: string, rounds = 12): Promise<string> {
    return bcrypt.hash(plainText, rounds);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }

  static async generateSalt(rounds = 12): Promise<string> {
    return bcrypt.genSalt(rounds);
  }
}