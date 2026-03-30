import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation token', example: 'abc123def456...' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
