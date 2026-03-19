import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AllocationTargetDto {
  @IsString()
  tagId: string;

  @IsNumber()
  targetAllocation: number;

  @IsOptional()
  @IsString()
  color?: string;
}

export class SetAllocationTargetsDto {
  @IsNumber()
  @IsOptional()
  availableCash?: number;

  targets: AllocationTargetDto[];
}
