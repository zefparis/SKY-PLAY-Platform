import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag

@Injectable()
export class CryptoHelper {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('ENCRYPTION_KEY') ?? '';
    if (raw.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    // Take exactly 32 bytes (256-bit key)
    this.key = Buffer.from(raw.slice(0, 32), 'utf8');
  }

  /**
   * Encrypts plaintext with AES-256-GCM.
   * Returns a hex string: iv(24):tag(32):ciphertext
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: TAG_LENGTH,
    }) as crypto.CipherGCM;

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  /**
   * Decrypts a hex string produced by encrypt().
   */
  decrypt(encoded: string): string {
    const [ivHex, tagHex, dataHex] = encoded.split(':');
    if (!ivHex || !tagHex || !dataHex) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: TAG_LENGTH,
    }) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
