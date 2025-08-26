import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '@/common/dto';
import { PaginatedResult } from '@/common/interfaces';
import { Expense } from './entities/expense.entity';
import { ExpenseApproval } from './entities/expense-approval.entity';
import { ExpenseAttachment } from './entities/expense-attachment.entity';
import { 
  ExpenseStatus, 
  ExpenseType, 
  ExpenseCategory,
  ExpenseApprovalLevel 
} from './enums';
import { ApprovalStatus } from './entities/expense-approval.entity';
import { ExpenseQueryDto } from './dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseApproval)
    private expenseApprovalRepository: Repository<ExpenseApproval>,
    @InjectRepository(ExpenseAttachment)
    private expenseAttachmentRepository: Repository<ExpenseAttachment>,
  ) {}

  async create(createExpenseDto: any, userId: string): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      submittedBy: { id: userId } as any,
    }) as unknown as Expense;

    const savedExpense = await this.expenseRepository.save(expense) as Expense;

    // Create approval workflow based on amount
    await this.createApprovalWorkflow(savedExpense);

    return savedExpense;
  }

  private async createApprovalWorkflow(expense: Expense): Promise<void> {
    const approvals = [];

    // Define approval rules based on amount
    if (expense.amount <= 500) {
      // Manager approval only
      approvals.push({
        expense,
        approvalLevel: ExpenseApprovalLevel.MANAGER,
        sequence: 1,
        isRequired: true,
        maximumAmount: 500,
      });
    } else if (expense.amount <= 2000) {
      // Manager + Senior Manager
      approvals.push(
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.MANAGER,
          sequence: 1,
          isRequired: true,
          maximumAmount: 2000,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.SENIOR_MANAGER,
          sequence: 2,
          isRequired: true,
          maximumAmount: 2000,
        },
      );
    } else if (expense.amount <= 10000) {
      // Manager + Senior Manager + Finance Head
      approvals.push(
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.MANAGER,
          sequence: 1,
          isRequired: true,
          maximumAmount: 10000,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.SENIOR_MANAGER,
          sequence: 2,
          isRequired: true,
          maximumAmount: 10000,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.FINANCE_HEAD,
          sequence: 3,
          isRequired: true,
          maximumAmount: 10000,
        },
      );
    } else {
      // Full approval chain
      approvals.push(
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.MANAGER,
          sequence: 1,
          isRequired: true,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.SENIOR_MANAGER,
          sequence: 2,
          isRequired: true,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.FINANCE_HEAD,
          sequence: 3,
          isRequired: true,
        },
        {
          expense,
          approvalLevel: ExpenseApprovalLevel.CFO,
          sequence: 4,
          isRequired: true,
        },
      );
    }

    await this.expenseApprovalRepository.save(approvals);
    
    // Update expense status
    expense.status = ExpenseStatus.PENDING_APPROVAL;
    await this.expenseRepository.save(expense);
  }

  async findAll(
    paginationDto: ExpenseQueryDto,
    filters?: {
      status?: ExpenseStatus[];
      type?: ExpenseType[];
      category?: ExpenseCategory[];
      submittedBy?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<PaginatedResult<Expense>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.submittedBy', 'submittedBy')
      .leftJoinAndSelect('expense.company', 'company')
      .leftJoinAndSelect('expense.branch', 'branch')
      .leftJoinAndSelect('expense.approvals', 'approvals')
      .leftJoinAndSelect('expense.attachments', 'attachments');

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        queryBuilder.andWhere('expense.status IN (:...statuses)', { statuses: filters.status });
      }
      if (filters.type && filters.type.length > 0) {
        queryBuilder.andWhere('expense.type IN (:...types)', { types: filters.type });
      }
      if (filters.category && filters.category.length > 0) {
        queryBuilder.andWhere('expense.category IN (:...categories)', { categories: filters.category });
      }
      if (filters.submittedBy) {
        queryBuilder.andWhere('expense.submittedBy.id = :submittedBy', { submittedBy: filters.submittedBy });
      }
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      }
    }

    const [items, total] = await queryBuilder
      .orderBy('expense.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: [
        'submittedBy',
        'company',
        'branch',
        'approvals',
        'approvals.approver',
        'approvals.assignedTo',
        'attachments',
      ],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async approveExpense(
    id: string, 
    userId: string, 
    approvalLevel: ExpenseApprovalLevel,
    comments?: string,
    approvedAmount?: number
  ): Promise<Expense> {
    const expense = await this.findOne(id);

    if (!expense.isPendingApproval) {
      throw new BadRequestException('Expense is not in pending approval state');
    }

    const approval = expense.approvals.find(
      a => a.approvalLevel === approvalLevel && a.isPending
    );

    if (!approval) {
      throw new BadRequestException('No pending approval found for this level');
    }

    approval.status = ApprovalStatus.APPROVED;
    approval.approver = { id: userId } as any;
    approval.approvedDate = new Date();
    approval.comments = comments;
    approval.approvedAmount = approvedAmount || expense.amount;

    await this.expenseApprovalRepository.save(approval);

    // Check if all required approvals are complete
    const allApprovals = await this.expenseApprovalRepository.find({
      where: { expense: { id } },
      order: { sequence: 'ASC' },
    });

    const allRequiredApproved = allApprovals
      .filter(a => a.isRequired)
      .every(a => a.isApproved);

    if (allRequiredApproved) {
      expense.status = ExpenseStatus.APPROVED;
      expense.approvedAmount = Math.min(...allApprovals.map(a => a.approvedAmount || expense.amount));
    }

    return await this.expenseRepository.save(expense);
  }

  async rejectExpense(
    id: string, 
    userId: string, 
    approvalLevel: ExpenseApprovalLevel,
    rejectionReason: string
  ): Promise<Expense> {
    const expense = await this.findOne(id);

    if (!expense.isPendingApproval) {
      throw new BadRequestException('Expense is not in pending approval state');
    }

    const approval = expense.approvals.find(
      a => a.approvalLevel === approvalLevel && a.isPending
    );

    if (!approval) {
      throw new BadRequestException('No pending approval found for this level');
    }

    approval.status = ApprovalStatus.REJECTED;
    approval.approver = { id: userId } as any;
    approval.approvedDate = new Date();
    approval.comments = rejectionReason;

    await this.expenseApprovalRepository.save(approval);

    expense.status = ExpenseStatus.REJECTED;
    expense.rejectionReason = rejectionReason;

    return await this.expenseRepository.save(expense);
  }

  async submitExpense(id: string): Promise<Expense> {
    const expense = await this.findOne(id);

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft expenses can be submitted');
    }

    if (!expense.hasRequiredAttachments) {
      throw new BadRequestException('Required attachments are missing');
    }

    expense.status = ExpenseStatus.SUBMITTED;
    return await this.expenseRepository.save(expense);
  }

  async markAsPaid(id: string, userId: string): Promise<Expense> {
    const expense = await this.findOne(id);

    if (!expense.isApproved) {
      throw new BadRequestException('Only approved expenses can be marked as paid');
    }

    expense.status = ExpenseStatus.PAID;
    return await this.expenseRepository.save(expense);
  }

  async addAttachment(expenseId: string, attachmentData: any): Promise<ExpenseAttachment> {
    const expense = await this.findOne(expenseId);

    const attachment = this.expenseAttachmentRepository.create({
      ...attachmentData,
      expense,
    }) as unknown as ExpenseAttachment;

    return await this.expenseAttachmentRepository.save(attachment);
  }

  async getDashboardStats(filters?: { startDate?: Date; endDate?: Date }): Promise<any> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.where('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const totalExpenses = await queryBuilder.getCount();
    
    const pendingExpenses = await queryBuilder
      .clone()
      .andWhere('expense.status IN (:...statuses)', { 
        statuses: [ExpenseStatus.SUBMITTED, ExpenseStatus.PENDING_APPROVAL] 
      })
      .getCount();

    const approvedExpenses = await queryBuilder
      .clone()
      .andWhere('expense.status = :status', { status: ExpenseStatus.APPROVED })
      .getCount();

    const paidExpenses = await queryBuilder
      .clone()
      .andWhere('expense.status = :status', { status: ExpenseStatus.PAID })
      .getCount();

    const totalAmount = await queryBuilder
      .select('SUM(expense.totalAmount)', 'total')
      .getRawOne();

    const paidAmount = await queryBuilder
      .clone()
      .andWhere('expense.status = :status', { status: ExpenseStatus.PAID })
      .select('SUM(expense.totalAmount)', 'total')
      .getRawOne();

    // Category breakdown
    const categoryStats = await queryBuilder
      .select(['expense.category', 'COUNT(*) as count', 'SUM(expense.totalAmount) as amount'])
      .groupBy('expense.category')
      .getRawMany();

    return {
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      paidExpenses,
      totalAmount: totalAmount?.total || 0,
      paidAmount: paidAmount?.total || 0,
      categoryStats,
    };
  }
}
