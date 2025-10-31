import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { Credit, CreditPayment, CreditTransaction } from './entities';
import { Customer } from '../customer/entities/customer.entity';
import { CreditPdfService } from './services/credit-pdf.service';
import { Sales } from '../sales/entities/sales.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credit,
      CreditPayment,
      CreditTransaction,
      Customer,
      Sales,
    ]),
  ],
  controllers: [CreditController],
  providers: [CreditService, CreditPdfService],
  exports: [CreditService, CreditPdfService],
})
export class CreditModule {}