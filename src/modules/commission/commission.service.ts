import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Sales } from '../sales/entities/sales.entity';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UserRole } from '@/common/enums';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Commission)
    private readonly commissionRepository: Repository<Commission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
  ) {}

  async create(createCommissionDto: CreateCommissionDto): Promise<Commission> {
    const { employeeId, productId, saleId, commissionRate, commissionAmount } = createCommissionDto;
    const employee = await this.userRepository.findOne({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');

    const commission = this.commissionRepository.create({
      employee,
      product,
      sale,
      commissionRate,
      commissionAmount,
    });
    return this.commissionRepository.save(commission);
  }

  async findAll(): Promise<Commission[]> {
    return this.commissionRepository.find({ relations: ['employee', 'product', 'sale'] });
  }

  async findByEmployee(employeeId: string): Promise<Commission[]> {
    return this.commissionRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee', 'product', 'sale'],
    });
  }

  async findBySale(saleId: string): Promise<Commission[]> {
    return this.commissionRepository.find({
      where: { sale: { id: saleId } },
      relations: ['employee', 'product', 'sale'],
    });
  }

  /**
   * Approve multiple commissions
   */
  async approveCommissions(commissionIds: string[], approvedBy: User): Promise<Commission[]> {
    if (!approvedBy || (approvedBy.role !== UserRole.SUPER_ADMIN && approvedBy.role !== UserRole.COMPANY_ADMIN)) {
      throw new ForbiddenException('Only admins can approve commissions');
    }

    const commissions = await this.commissionRepository.find({
      where: { id: In(commissionIds) },
      relations: ['employee', 'employee.company']
    });

    if (commissions.length === 0) {
      throw new NotFoundException('No commissions found');
    }

    // Company Admin can only approve commissions within their company
    if (approvedBy.role === UserRole.COMPANY_ADMIN) {
      const invalidCommissions = commissions.filter(c => 
        !c.employee.company || c.employee.company.id !== approvedBy.company?.id
      );
      
      if (invalidCommissions.length > 0) {
        throw new ForbiddenException('Company Admin can only approve commissions within their company');
      }
    }

    // Update commissions with approval
    const updatedCommissions = commissions.map(commission => ({
      ...commission,
      isApproved: true,
      approvedBy: approvedBy.id,
      approvedAt: new Date()
    }));

    return this.commissionRepository.save(updatedCommissions);
  }

  /**
   * Get commission report for an employee
   */
  async getCommissionReport(employeeId: string, dateRange: { startDate: Date, endDate: Date }): Promise<any> {
    const commissions = await this.commissionRepository.find({
      where: {
        employee: { id: employeeId },
        commissionDate: Between(dateRange.startDate, dateRange.endDate)
      },
      relations: ['employee', 'product', 'sale'],
      order: { commissionDate: 'DESC' }
    });

    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const approvedCommissions = commissions.filter(c => c.isApproved);
    const totalApproved = approvedCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissions = commissions.filter(c => !c.isApproved);
    const totalPending = pendingCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);

    return {
      employeeId,
      dateRange,
      summary: {
        totalCommissions: commissions.length,
        totalAmount: totalCommissions,
        approvedAmount: totalApproved,
        pendingAmount: totalPending,
        approvedCount: approvedCommissions.length,
        pendingCount: pendingCommissions.length
      },
      commissions: commissions.map(c => ({
        id: c.id,
        amount: c.commissionAmount,
        rate: c.commissionRate,
        commissionDate: c.commissionDate,
        isApproved: c.isApproved,
        approvedAt: c.approvedAt,
        product: {
          id: c.product.id,
          name: c.product.name,
          sku: c.product.sku
        },
        sale: {
          id: c.sale.id,
          totalAmount: c.sale.totalAmount,
          saleDate: c.sale.saleDate
        }
      }))
    };
  }

  /**
   * Get pending commissions for approval
   */
  async getPendingCommissions(currentUser: User): Promise<Commission[]> {
    let whereCondition: any = { isApproved: false };

    // Company Admin can only see commissions from their company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      whereCondition = {
        ...whereCondition,
        employee: { company: { id: currentUser.company?.id } }
      };
    }

    return this.commissionRepository.find({
      where: whereCondition,
      relations: ['employee', 'employee.user', 'employee.company', 'product', 'sale'],
      order: { commissionDate: 'DESC' }
    });
  }
}
