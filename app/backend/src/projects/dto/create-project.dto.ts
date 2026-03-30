import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project title', example: 'Commercial Law Research' })
  @IsString()
  @IsNotEmpty()
  title!: string;
}
