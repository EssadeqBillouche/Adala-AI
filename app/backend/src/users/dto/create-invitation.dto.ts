import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
