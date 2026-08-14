import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EncryptionService } from '@/common/encryption/encryption.service';
import { RedisService } from '@/common/redis/redis.service';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  /**
   * Register new user with phone number
   */
  async register(registerDto: RegisterDto) {
    const { phoneNumber, password, displayName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Hash password
    const { hash, salt } = this.encryptionService.hashPassword(password);

    // Generate OTP
    const otp = this.encryptionService.generateOTP();
    const otpKey = `otp:${phoneNumber}`;

    // Store OTP in Redis (5 minutes expiry)
    await this.redisService.set(otpKey, otp, 300);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        phoneNumber,
        displayName: displayName || phoneNumber,
        passwordHash: `${hash}:${salt}`,
        isVerified: false,
      },
    });

    this.logger.log(`User registered: ${phoneNumber}`);

    // In production, send OTP via SMS
    // For development, return OTP
    return {
      userId: user.id,
      message: 'OTP sent to your phone number',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phoneNumber, otp } = verifyOtpDto;

    const otpKey = `otp:${phoneNumber}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Delete OTP from Redis
    await this.redisService.del(otpKey);

    // Mark user as verified
    const user = await this.prisma.user.update({
      where: { phoneNumber },
      data: { isVerified: true },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const { phoneNumber, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    // Verify password
    const [hash, salt] = user.passwordHash.split(':');
    const isPasswordValid = this.encryptionService.verifyPassword(password, hash, salt);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRY'),
    });

    // Store refresh token in database
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + parseInt(this.configService.get('JWT_EXPIRY')) * 1000),
      },
    });

    return {
      userId: user.id,
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('JWT_EXPIRY'),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: { userId, token },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout all sessions
   */
  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'All sessions logged out' };
  }
}
