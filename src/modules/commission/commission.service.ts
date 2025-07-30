import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Sales } from '../sales/entities/sales.entity';
import { CreateCommissionDto } from './dto/create-commission.dto';

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
}
