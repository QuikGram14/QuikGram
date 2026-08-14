import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger('EncryptionService');

  /**
   * Generate a key pair for user
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt message with AES-256-GCM
   */
  encryptMessage(message: string, key: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt message with AES-256-GCM
   */
  decryptMessage(encryptedData: string, key: Buffer): string {
    const data = JSON.parse(encryptedData);

    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      iv,
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt with public key (RSA)
   */
  encryptWithPublicKey(message: string, publicKey: string): string {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(message),
    );

    return encrypted.toString('base64');
  }

  /**
   * Decrypt with private key (RSA)
   */
  decryptWithPrivateKey(encrypted: string, privateKey: string): string {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encrypted, 'base64'),
    );

    return decrypted.toString('utf8');
  }

  /**
   * Generate shared secret from two public keys
   */
  generateSharedSecret(publicKey1: string, publicKey2: string): Buffer {
    // In production, use ECDH or similar
    const combined = publicKey1 + publicKey2;
    return crypto.createHash('sha256').update(combined).digest();
  }

  /**
   * Hash password with bcrypt-like algorithm
   */
  hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');

    return { hash, salt };
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const hashToCompare = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');

    return hash === hashToCompare;
  }

  /**
   * Generate OTP code
   */
  generateOTP(length: number = 6): string {
    return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
