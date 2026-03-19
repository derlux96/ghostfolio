import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  targetAllocation?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
