import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { Credit, CreditPayment, CreditTransaction } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Credit,
      CreditPayment,
      CreditTransaction,
    ]),
  ],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}