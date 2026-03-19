import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  targetAllocation?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
