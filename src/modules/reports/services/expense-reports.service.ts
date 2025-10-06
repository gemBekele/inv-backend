import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { ExpenseReportQueryDto } from '../dto/report.dto';

@Injectable()
export class ExpenseReportsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async generateExpenseReport(query: ExpenseReportQueryDto) {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.submittedBy', 'submittedBy')
      .leftJoinAndSelect('expense.company', 'company')
      .leftJoinAndSelect('expense.branch', 'branch');

    // Apply date filters if provided
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    // Apply additional filters
    if (query.companyId) {
      queryBuilder.andWhere('expense.companyId = :companyId', { companyId: query.companyId });
    }

    const [expenses, totalCount] = await queryBuilder.getManyAndCount();

    // Calculate totals
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
    const paidAmount = expenses
      .filter(expense => expense.status === 'paid')
      .reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
    const pendingAmount = expenses
      .filter(expense => ['submitted', 'pending_approval', 'approved'].includes(expense.status))
      .reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);

    return {
      metadata: { 
        generatedAt: new Date(), 
        totalRecords: totalCount, 
        filters: query,
        dateRange: query.startDate && query.endDate ? {
          startDate: query.startDate,
          endDate: query.endDate
        } : null
      },
      items: expenses.map(expense => ({
        id: expense.id,
        expenseNumber: expense.expenseNumber,
        title: expense.title,
        description: expense.description,
        amount: Number(expense.amount || 0),
        totalAmount: Number(expense.totalAmount || 0),
        status: expense.status,
        type: expense.type,
        category: expense.category,
        expenseDate: expense.expenseDate,
        submittedBy: expense.submittedBy ? {
          id: expense.submittedBy.id,
          name: `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`,
          email: expense.submittedBy.email
        } : null,
        company: expense.company ? {
          id: expense.company.id,
          name: expense.company.name
        } : null,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      })),
      summary: { 
        totalExpenses: totalCount, 
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        averageAmount: totalCount > 0 ? totalAmount / totalCount : 0
      }
    };
  }

  async generateExpenseByCategoryReport(query: ExpenseReportQueryDto) {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .select(['expense.category', 'COUNT(*) as count', 'SUM(expense.totalAmount) as totalAmount'])
      .groupBy('expense.category');

    // Apply date filters if provided
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    // Apply additional filters
    if (query.companyId) {
      queryBuilder.andWhere('expense.companyId = :companyId', { companyId: query.companyId });
    }

    const categoryStats = await queryBuilder.getRawMany();

    const totalCategories = categoryStats.length;
    const totalAmount = categoryStats.reduce((sum, stat) => sum + Number(stat.totalAmount || 0), 0);
    const totalCount = categoryStats.reduce((sum, stat) => sum + Number(stat.count || 0), 0);

    return {
      metadata: { 
        generatedAt: new Date(), 
        totalRecords: totalCount, 
        filters: query,
        dateRange: query.startDate && query.endDate ? {
          startDate: query.startDate,
          endDate: query.endDate
        } : null
      },
      items: categoryStats.map(stat => ({
        category: stat.expense_category,
        count: Number(stat.count || 0),
        totalAmount: Number(stat.totalAmount || 0),
        percentage: totalAmount > 0 ? (Number(stat.totalAmount || 0) / totalAmount * 100).toFixed(2) : 0
      })),
      summary: { 
        totalCategories: totalCategories, 
        totalAmount: totalAmount,
        totalExpenses: totalCount,
        averagePerCategory: totalCategories > 0 ? totalAmount / totalCategories : 0
      }
    };
  }
}
