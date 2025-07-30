import { IsUUID, IsNumber } from 'class-validator';

export class CreateCommissionDto {
  @IsUUID()
  employeeId: string;

  @IsUUID()
  productId: string;

  @IsUUID()
  saleId: string;

  @IsNumber()
  commissionRate: number;

  @IsNumber()
  commissionAmount: number;
}
