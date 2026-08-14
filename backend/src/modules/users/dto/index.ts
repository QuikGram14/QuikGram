import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class BlockUserDto {
  @IsString()
  targetUserId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddContactDto {
  @IsString()
  contactUserId: string;
}
