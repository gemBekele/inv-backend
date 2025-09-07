import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Credit, CreditPayment, CreditTransaction } from './entities';
import { CreateCreditDto, UpdateCreditDto, CreateCreditPaymentDto, CreditQueryDto, CreditResponseDto, CreditPaymentResponseDto, CreditTransactionResponseDto, CreditStatsResponseDto } from './dto';
import { CreditStatus, PaymentStatus, TransactionType } from './enums';
import { User } from '../users/entities/user.entity';
import { BaseMultiTenantService } from '../../common/services/base-multi-tenant.service';
import { UserRole } from '../../common/enums';

@Injectable()
export class CreditService extends BaseMultiTenantService {
  constructor(
    @InjectRepository(Credit)
    private creditRepository: Repository<Credit>,
    @InjectRepository(CreditPayment)
    private paymentRepository: Repository<CreditPayment>,
    @InjectRepository(CreditTransaction)
    private transactionRepository: Repository<CreditTransaction>,
  ) {
    super();
  }

  async create(createCreditDto: CreateCreditDto, user: User): Promise<CreditResponseDto> {
    const credit = this.creditRepository.create({
      ...createCreditDto,
      companyId: user.company?.id,
      createdById: user.id,
      issueDate: createCreditDto.issueDate ? new Date(createCreditDto.issueDate) : new Date(),
      dueDate: createCreditDto.dueDate ? new Date(createCreditDto.dueDate) : undefined,
    });

    const savedCredit = await this.creditRepository.save(credit);

    await this.createTransaction({
      creditId: savedCredit.id,
      type: TransactionType.CREDIT_ISSUED,
      amount: savedCredit.principalAmount,
      balanceAfter: savedCredit.principalAmount,
      description: `Credit ${savedCredit.creditNumber} issued`,
      processedById: user.id,
    });

    const fullCredit = await this.findOneEntity(savedCredit.id, user);
    return this.transformCreditToResponse(fullCredit);
  }

  async findAll(query: CreditQueryDto, user: User) {
    const queryBuilder = this.createQueryBuilder(user);

    this.applyFilters(queryBuilder, query);
    this.applySorting(queryBuilder, query);

    const [credits, total] = await queryBuilder
      .skip(query.skip)
      .limit(query.limit)
      .getManyAndCount();

    return {
      data: credits.map(credit => this.transformCreditToResponse(credit)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string, user: User): Promise<CreditResponseDto> {
    const credit = await this.findOneEntity(id, user);
    return this.transformCreditToResponse(credit);
  }

  private async findOneEntity(id: string, user: User): Promise<Credit> {
    const queryBuilder = this.creditRepository
      .createQueryBuilder('credit')
      .leftJoinAndSelect('credit.customer', 'customer')
      .leftJoinAndSelect('credit.createdBy', 'createdBy')
      .leftJoinAndSelect('credit.approvedBy', 'approvedBy')
      .leftJoinAndSelect('credit.payments', 'payments')
      .leftJoinAndSelect('credit.transactions', 'transactions')
      .where('credit.id = :id', { id });

    // Apply multi-tenant filtering
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    const credit = await queryBuilder.getOne();

    if (!credit) {
      throw new NotFoundException('Credit not found');
    }

    return credit;
  }

  async update(id: string, updateCreditDto: UpdateCreditDto, user: User): Promise<CreditResponseDto> {
    const credit = await this.findOneEntity(id, user);

    Object.assign(credit, {
      ...updateCreditDto,
      dueDate: updateCreditDto.dueDate ? new Date(updateCreditDto.dueDate) : credit.dueDate,
    });

    await this.creditRepository.save(credit);
    const updatedCredit = await this.findOneEntity(id, user);
    return this.transformCreditToResponse(updatedCredit);
  }

  async approve(id: string, user: User): Promise<CreditResponseDto> {
    const credit = await this.findOneEntity(id, user);

    if (credit.status !== CreditStatus.PENDING) {
      throw new BadRequestException('Only pending credits can be approved');
    }

    credit.status = CreditStatus.APPROVED;
    credit.approvedById = user.id;
    credit.approvedDate = new Date();

    await this.creditRepository.save(credit);

    await this.createTransaction({
      creditId: credit.id,
      type: TransactionType.CREDIT_ISSUED,
      amount: 0,
      balanceAfter: credit.remainingBalance,
      description: `Credit ${credit.creditNumber} approved`,
      processedById: user.id,
    });

    const approvedCredit = await this.findOneEntity(id, user);
    return this.transformCreditToResponse(approvedCredit);
  }

  async createPayment(creditId: string, createPaymentDto: CreateCreditPaymentDto, user: User): Promise<CreditPaymentResponseDto> {
    const credit = await this.findOneEntity(creditId, user);

    if (credit.isFullyPaid) {
      throw new BadRequestException('Credit is already fully paid');
    }

    if (createPaymentDto.amount > credit.remainingBalance) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      creditId: credit.id,
      processedById: user.id,
      paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
      status: PaymentStatus.COMPLETED,
    });

    const remainingAmount = createPaymentDto.amount;
    payment.principalAmount = Math.min(remainingAmount, credit.remainingBalance);
    payment.interestAmount = 0;
    payment.feesAmount = 0;

    const savedPayment = await this.paymentRepository.save(payment);

    credit.paidAmount += payment.amount;
    credit.remainingBalance -= payment.principalAmount;

    if (credit.remainingBalance <= 0) {
      credit.status = CreditStatus.FULLY_PAID;
      credit.remainingBalance = 0;
    } else if (credit.paidAmount > 0) {
      credit.status = CreditStatus.PARTIALLY_PAID;
    }

    await this.creditRepository.save(credit);

    await this.createTransaction({
      creditId: credit.id,
      type: TransactionType.PAYMENT_RECEIVED,
      amount: payment.amount,
      balanceAfter: credit.remainingBalance,
      description: `Payment ${payment.paymentNumber} received`,
      referenceId: payment.id,
      processedById: user.id,
    });

    const fullPayment = await this.findPaymentEntity(savedPayment.id, user);
    return this.transformPaymentToResponse(fullPayment);
  }

  async findPayments(creditId: string, user: User): Promise<CreditPaymentResponseDto[]> {
    await this.findOneEntity(creditId, user);

    const payments = await this.paymentRepository.find({
      where: { creditId },
      relations: ['processedBy'],
      order: { paymentDate: 'DESC' },
    });

    return payments.map(payment => this.transformPaymentToResponse(payment));
  }

  async findPayment(paymentId: string, user: User): Promise<CreditPaymentResponseDto> {
    const payment = await this.findPaymentEntity(paymentId, user);
    return this.transformPaymentToResponse(payment);
  }

  private async findPaymentEntity(paymentId: string, user: User): Promise<CreditPayment> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.credit', 'credit')
      .leftJoinAndSelect('payment.processedBy', 'processedBy')
      .where('payment.id = :paymentId', { paymentId });

    // Apply multi-tenant filtering through credit relationship
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    const payment = await queryBuilder.getOne();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findTransactions(creditId: string, user: User): Promise<CreditTransactionResponseDto[]> {
    await this.findOneEntity(creditId, user);

    const transactions = await this.transactionRepository.find({
      where: { creditId },
      relations: ['processedBy'],
      order: { transactionDate: 'DESC' },
    });

    return transactions.map(transaction => this.transformTransactionToResponse(transaction));
  }

  async getStats(user: User): Promise<CreditStatsResponseDto> {
    const queryBuilder = this.creditRepository
      .createQueryBuilder('credit');

    // Apply multi-tenant filtering
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    const [
      totalCredits,
      totalPrincipalAmount,
      totalPaidAmount,
      totalRemainingBalance,
      overdueCredits,
      creditsByType,
      creditsByStatus,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('SUM(credit.principalAmount)', 'sum').getRawOne().then(r => parseFloat(r.sum) || 0),
      queryBuilder.select('SUM(credit.paidAmount)', 'sum').getRawOne().then(r => parseFloat(r.sum) || 0),
      queryBuilder.select('SUM(credit.remainingBalance)', 'sum').getRawOne().then(r => parseFloat(r.sum) || 0),
      queryBuilder.andWhere('credit.dueDate < :now AND credit.remainingBalance > 0', { now: new Date() }).getCount(),
      this.getStatsByField('type', user),
      this.getStatsByField('status', user),
    ]);

    const totalOverdueAmount = await queryBuilder
      .select('SUM(credit.remainingBalance)', 'sum')
      .andWhere('credit.dueDate < :now AND credit.remainingBalance > 0', { now: new Date() })
      .getRawOne()
      .then(r => parseFloat(r.sum) || 0);

    const averagePaymentPercentage = totalPrincipalAmount > 0 
      ? (totalPaidAmount / totalPrincipalAmount) * 100 
      : 0;

    const agingAnalysis = await this.getAgingAnalysis(user);

    return {
      totalCredits,
      totalPrincipalAmount,
      totalPaidAmount,
      totalRemainingBalance,
      overdueCredits,
      totalOverdueAmount,
      averagePaymentPercentage,
      creditsByType: {
        receivable: creditsByType['receivable'] || 0,
        payable: creditsByType['payable'] || 0,
        loan: creditsByType['loan'] || 0,
        advance: creditsByType['advance'] || 0,
      },
      creditsByStatus: {
        pending: creditsByStatus['pending'] || 0,
        approved: creditsByStatus['approved'] || 0,
        active: creditsByStatus['active'] || 0,
        partially_paid: creditsByStatus['partially_paid'] || 0,
        fully_paid: creditsByStatus['fully_paid'] || 0,
        overdue: creditsByStatus['overdue'] || 0,
        written_off: creditsByStatus['written_off'] || 0,
        cancelled: creditsByStatus['cancelled'] || 0,
      },
      agingAnalysis,
    };
  }

  async remove(id: string, user: User): Promise<void> {
    const credit = await this.findOneEntity(id, user);

    if (credit.paidAmount > 0) {
      throw new BadRequestException('Cannot delete credit with payments');
    }

    await this.creditRepository.softDelete(id);
  }

  private createQueryBuilder(user: User): SelectQueryBuilder<Credit> {
    const queryBuilder = this.creditRepository
      .createQueryBuilder('credit')
      .leftJoinAndSelect('credit.customer', 'customer')
      .leftJoinAndSelect('credit.createdBy', 'createdBy')
      .leftJoinAndSelect('credit.approvedBy', 'approvedBy');

    // Apply multi-tenant filtering
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    return queryBuilder;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Credit>, query: CreditQueryDto): void {
    if (query.type) {
      queryBuilder.andWhere('credit.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('credit.status = :status', { status: query.status });
    }

    if (query.customerId) {
      queryBuilder.andWhere('credit.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.creditRating) {
      queryBuilder.andWhere('credit.creditRating = :creditRating', { creditRating: query.creditRating });
    }

    if (query.isOverdue !== undefined) {
      if (query.isOverdue) {
        queryBuilder.andWhere('credit.dueDate < :now AND credit.remainingBalance > 0', { now: new Date() });
      } else {
        queryBuilder.andWhere('credit.dueDate >= :now OR credit.remainingBalance <= 0', { now: new Date() });
      }
    }

    if (query.dueDateFrom) {
      queryBuilder.andWhere('credit.dueDate >= :dueDateFrom', { dueDateFrom: query.dueDateFrom });
    }

    if (query.dueDateTo) {
      queryBuilder.andWhere('credit.dueDate <= :dueDateTo', { dueDateTo: query.dueDateTo });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(credit.creditNumber ILIKE :search OR credit.description ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Credit>, query: CreditQueryDto): void {
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`credit.${sortBy}`, sortOrder as 'ASC' | 'DESC');
  }

  private async createTransaction(data: {
    creditId: string;
    type: TransactionType;
    amount: number;
    balanceAfter: number;
    description?: string;
    referenceId?: string;
    processedById: string;
  }): Promise<CreditTransaction> {
    const transaction = this.transactionRepository.create(data);
    return this.transactionRepository.save(transaction);
  }

  private async getStatsByField(field: string, user: User): Promise<Record<string, number>> {
    const queryBuilder = this.creditRepository
      .createQueryBuilder('credit')
      .select(`credit.${field}`, 'key')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`credit.${field}`);

    // Apply multi-tenant filtering
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    const results = await queryBuilder.getRawMany();

    return results.reduce((acc, { key, count }) => {
      acc[key] = parseInt(count);
      return acc;
    }, {});
  }

  private async getAgingAnalysis(user: User) {
    const now = new Date();
    const queryBuilder = this.creditRepository
      .createQueryBuilder('credit')
      .select('credit.dueDate', 'dueDate')
      .addSelect('credit.remainingBalance', 'balance')
      .andWhere('credit.remainingBalance > 0');

    // Apply multi-tenant filtering
    this.applyCompanyFilter(queryBuilder, {
      id: user.id,
      role: user.role,
      companyId: user.company?.id
    }, 'credit');

    const results = await queryBuilder.getRawMany();

    const aging = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days91to120: 0,
      days120plus: 0,
    };

    results.forEach(({ dueDate, balance }) => {
      const daysPastDue = Math.ceil((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(balance);

      if (daysPastDue <= 0) aging.current += amount;
      else if (daysPastDue <= 30) aging.days1to30 += amount;
      else if (daysPastDue <= 60) aging.days31to60 += amount;
      else if (daysPastDue <= 90) aging.days61to90 += amount;
      else if (daysPastDue <= 120) aging.days91to120 += amount;
      else aging.days120plus += amount;
    });

    return aging;
  }

  private transformCreditToResponse(credit: Credit): CreditResponseDto {
    return {
      id: credit.id,
      creditNumber: credit.creditNumber,
      type: credit.type,
      status: credit.status,
      principalAmount: credit.principalAmount,
      interestAmount: credit.interestAmount,
      feesAmount: credit.feesAmount,
      totalAmount: credit.totalAmount,
      paidAmount: credit.paidAmount,
      remainingBalance: credit.remainingBalance,
      interestRate: credit.interestRate,
      issueDate: credit.issueDate.toISOString().split('T')[0],
      dueDate: credit.dueDate.toISOString().split('T')[0],
      paymentTermsDays: credit.paymentTermsDays,
      creditRating: credit.creditRating,
      description: credit.description,
      terms: credit.terms,
      notes: credit.notes,
      isDisputed: credit.isDisputed,
      disputeReason: credit.disputeReason,
      isOverdue: credit.isOverdue,
      daysPastDue: credit.daysPastDue,
      paymentPercentage: credit.paymentPercentage,
      agingCategory: credit.agingCategory,
      riskLevel: credit.riskLevel,
      createdAt: credit.createdAt.toISOString(),
      updatedAt: credit.updatedAt.toISOString(),
      customer: credit.customer ? {
        id: credit.customer.id,
        name: credit.customer.name,
        phoneNumber: credit.customer.phoneNumber,
      } : undefined,
      createdBy: credit.createdBy ? {
        id: credit.createdBy.id,
        firstName: credit.createdBy.firstName,
        lastName: credit.createdBy.lastName,
      } : undefined,
      approvedBy: credit.approvedBy ? {
        id: credit.approvedBy.id,
        firstName: credit.approvedBy.firstName,
        lastName: credit.approvedBy.lastName,
      } : undefined,
    };
  }

  private transformPaymentToResponse(payment: CreditPayment): CreditPaymentResponseDto {
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      principalAmount: payment.principalAmount,
      interestAmount: payment.interestAmount,
      feesAmount: payment.feesAmount,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      processedBy: payment.processedBy ? {
        id: payment.processedBy.id,
        firstName: payment.processedBy.firstName,
        lastName: payment.processedBy.lastName,
      } : undefined,
    };
  }

  private transformTransactionToResponse(transaction: CreditTransaction): CreditTransactionResponseDto {
    return {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      transactionDate: transaction.transactionDate.toISOString().split('T')[0],
      description: transaction.description,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt.toISOString(),
      processedBy: transaction.processedBy ? {
        id: transaction.processedBy.id,
        firstName: transaction.processedBy.firstName,
        lastName: transaction.processedBy.lastName,
      } : undefined,
    };
  }
}