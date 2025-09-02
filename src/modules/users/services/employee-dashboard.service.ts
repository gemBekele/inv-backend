import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { User } from '../entities/user.entity';
import { Sales } from '../../sales/entities/sales.entity';
import { Commission } from '../../commission/entities/commission.entity';
import { SaleStatus } from '../../sales/enums';
import { UserRole } from '@/common/enums';

@Injectable()
export class EmployeeDashboardService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    @InjectRepository(Commission)
    private readonly commissionRepository: Repository<Commission>,
  ) {}

  /**
   * Get comprehensive dashboard data for an employee
   */
  async getEmployeeDashboard(userId: string): Promise<any> {
    // Get user and employee information
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'firstName', 'lastName', 'role', 'email', 'phone', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company', 'shop', 'warehouse']
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found');
    }

    // Get employee sales statistics
    const salesStats = await this.getEmployeeSalesStats(employee.id);
    
    // Get commission information
    const commissionStats = await this.getEmployeeCommissionStats(employee.id);
    
    // Get recent sales
    const recentSales = await this.getRecentEmployeeSales(employee.id, 10);

    // Get inventory alerts for employee's location
    const inventoryAlerts = await this.getInventoryAlerts(employee);

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        jobTitle: employee.jobTitle,
        baseCommissionRate: employee.baseCommissionRate,
        createdAt: employee.createdAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: `${user.firstName} ${user.lastName}`,
          joinedAt: user.createdAt
        },
        assignments: {
          company: employee.company ? {
            id: employee.company.id,
            name: employee.company.name
          } : null,
          shop: employee.shop ? {
            id: employee.shop.id,
            name: employee.shop.name
          } : null,
          warehouse: employee.warehouse ? {
            id: employee.warehouse.id,
            name: employee.warehouse.name
          } : null
        }
      },
      salesStats,
      commissionStats,
      recentSales,
      inventoryAlerts,
      permissions: this.getEmployeePermissions(user.role),
      generatedAt: new Date()
    };
  }

  /**
   * Get sales statistics for an employee
   */
  private async getEmployeeSalesStats(employeeId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Get sales created by this employee (through the user relationship)
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['user']
    });

    const userId = employee?.user?.id;

    if (!userId) {
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        averageSaleAmount: 0
      };
    }

    const [totalSales, todaySales, weekSales, monthSales] = await Promise.all([
      this.salesRepository.count({
        where: { 
          createdBy: { id: userId },
          status: SaleStatus.COMPLETED
        }
      }),
      this.salesRepository.count({
        where: { 
          createdBy: { id: userId },
          status: SaleStatus.COMPLETED,
          createdAt: { $gte: startOfDay } as any
        }
      }),
      this.salesRepository.count({
        where: { 
          createdBy: { id: userId },
          status: SaleStatus.COMPLETED,
          createdAt: { $gte: startOfWeek } as any
        }
      }),
      this.salesRepository.count({
        where: { 
          createdBy: { id: userId },
          status: SaleStatus.COMPLETED,
          createdAt: { $gte: startOfMonth } as any
        }
      })
    ]);

    // Get revenue statistics
    const revenueStats = await this.salesRepository
      .createQueryBuilder('sale')
      .select([
        'SUM(sale.totalAmount) as totalRevenue',
        'AVG(sale.totalAmount) as averageSaleAmount'
      ])
      .where('sale.createdBy = :userId', { userId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    const todayRevenue = await this.salesRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.totalAmount) as todayRevenue')
      .where('sale.createdBy = :userId', { userId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt >= :startOfDay', { startOfDay })
      .getRawOne();

    const weekRevenue = await this.salesRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.totalAmount) as weekRevenue')
      .where('sale.createdBy = :userId', { userId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt >= :startOfWeek', { startOfWeek })
      .getRawOne();

    const monthRevenue = await this.salesRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.totalAmount) as monthRevenue')
      .where('sale.createdBy = :userId', { userId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return {
      total: totalSales,
      today: todaySales,
      thisWeek: weekSales,
      thisMonth: monthSales,
      totalRevenue: parseFloat(revenueStats?.totalRevenue || '0'),
      todayRevenue: parseFloat(todayRevenue?.todayRevenue || '0'),
      weekRevenue: parseFloat(weekRevenue?.weekRevenue || '0'),
      monthRevenue: parseFloat(monthRevenue?.monthRevenue || '0'),
      averageSaleAmount: parseFloat(revenueStats?.averageSaleAmount || '0')
    };
  }

  /**
   * Get commission statistics for an employee
   */
  private async getEmployeeCommissionStats(employeeId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCommissions, monthCommissions, pendingCommissions] = await Promise.all([
      this.commissionRepository
        .createQueryBuilder('commission')
        .select('SUM(commission.commissionAmount) as total')
        .where('commission.employee = :employeeId', { employeeId })
        .getRawOne(),
      
      this.commissionRepository
        .createQueryBuilder('commission')
        .select('SUM(commission.commissionAmount) as monthTotal')
        .where('commission.employee = :employeeId', { employeeId })
        .andWhere('commission.createdAt >= :startOfMonth', { startOfMonth })
        .getRawOne(),

      this.commissionRepository
        .createQueryBuilder('commission')
        .select([
          'COUNT(commission.id) as pendingCount',
          'SUM(commission.commissionAmount) as pendingAmount'
        ])
        .where('commission.employee = :employeeId', { employeeId })
        .andWhere('commission.status = :status', { status: 'pending' })
        .getRawOne()
    ]);

    return {
      totalEarned: parseFloat(totalCommissions?.total || '0'),
      thisMonth: parseFloat(monthCommissions?.monthTotal || '0'),
      pending: {
        count: parseInt(pendingCommissions?.pendingCount || '0'),
        amount: parseFloat(pendingCommissions?.pendingAmount || '0')
      },
      baseRate: (await this.employeeRepository.findOne({ where: { id: employeeId } }))?.baseCommissionRate || 0
    };
  }

  /**
   * Get recent sales for an employee
   */
  private async getRecentEmployeeSales(employeeId: string, limit: number = 10): Promise<any[]> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['user']
    });

    if (!employee?.user?.id) {
      return [];
    }

    const sales = await this.salesRepository.find({
      where: { createdBy: { id: employee.user.id } },
      relations: ['customer', 'warehouse', 'shop'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    return sales.map(sale => ({
      id: sale.id,
      totalAmount: sale.totalAmount,
      status: sale.status,
      saleDate: sale.saleDate,
      customer: sale.customer ? {
        id: sale.customer.id,
        name: sale.customer.name
      } : null,
      location: sale.shop?.name || sale.warehouse?.name || 'Unknown',
      createdAt: sale.createdAt
    }));
  }

  /**
   * Get inventory alerts for employee's assigned locations
   */
  private async getInventoryAlerts(employee: Employee): Promise<any[]> {
    // This would integrate with inventory management
    // For now, return a placeholder structure
    return [
      {
        type: 'low_stock',
        message: '5 products are running low in your warehouse',
        count: 5,
        priority: 'medium'
      },
      {
        type: 'out_of_stock',
        message: '2 products are out of stock in your shop',
        count: 2,
        priority: 'high'
      }
    ];
  }

  /**
   * Get permissions based on employee role
   */
  private getEmployeePermissions(role: UserRole): any {
    const basePermissions = {
      canCreateSales: true,
      canViewSales: true,
      canViewOwnCommissions: true,
      canViewInventory: true
    };

    switch (role) {
      case UserRole.MANAGER:
        return {
          ...basePermissions,
          canViewAllSales: true,
          canManageEmployees: true,
          canViewReports: true,
          canProcessReturns: true
        };
      
      case UserRole.COMPANY_ADMIN:
        return {
          ...basePermissions,
          canViewAllSales: true,
          canManageEmployees: true,
          canViewReports: true,
          canProcessReturns: true,
          canManageCompany: true,
          canViewAllCommissions: true
        };

      case UserRole.SHOP_EMPLOYEE:
      case UserRole.WAREHOUSE_EMPLOYEE:
      default:
        return basePermissions;
    }
  }

  /**
   * Get quick actions available to the employee
   */
  async getEmployeeQuickActions(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['role']
    });

    const baseActions = [
      { 
        id: 'create_sale',
        title: 'Create New Sale',
        description: 'Start a new sale transaction',
        icon: 'shopping-cart',
        route: '/sales/create'
      },
      {
        id: 'search_customer',
        title: 'Search Customer',
        description: 'Find customer by phone number',
        icon: 'search',
        route: '/customers/search'
      },
      {
        id: 'view_commissions',
        title: 'My Commissions',
        description: 'View your commission earnings',
        icon: 'dollar-sign',
        route: '/commissions/my'
      }
    ];

    if (user?.role === UserRole.MANAGER || user?.role === UserRole.COMPANY_ADMIN) {
      baseActions.push({
        id: 'view_reports',
        title: 'Sales Reports',
        description: 'View sales performance reports',
        icon: 'bar-chart',
        route: '/reports/sales'
      });
    }

    return baseActions;
  }
}
