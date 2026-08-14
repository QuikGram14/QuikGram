import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateChatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  members: string[];
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}

export class AddUserToChatDto {
  @IsString()
  targetUserId: string;
}
