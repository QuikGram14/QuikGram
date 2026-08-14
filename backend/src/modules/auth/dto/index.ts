import { IsPhoneNumber, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsPhoneNumber('ZZ', { message: 'Valid phone number is required' })
  phoneNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsPhoneNumber('ZZ', { message: 'Valid phone number is required' })
  phoneNumber: string;

  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('ZZ', { message: 'Valid phone number is required' })
  phoneNumber: string;

  @IsString()
  @MinLength(6, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
