import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto, CompanyResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { Warehouse } from '../warehouse/entities/warehouse.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
	@InjectRepository(Warehouse)
	private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
	const existingCompany = await this.companyRepository.findOne({ where: { name: createCompanyDto.name } });
	if (existingCompany) {
	  throw new ConflictException('Company with this name already exists');
	}
	const warehouseExists = await this.warehouseRepository.findOne({ where: { id:In (createCompanyDto.warehouseIds) } });
	if (!warehouseExists) {
	  throw new NotFoundException('Warehouse not found');
	}
    const company = this.companyRepository.create(createCompanyDto);
    const savedCompany = await this.companyRepository.save(company);
    return this.mapToResponseDto(savedCompany);
  }

  async findAll(query: CompanyQueryDto): Promise<PaginatedResult<CompanyResponseDto>> {
    const { search } = query;
    const queryBuilder = this.companyRepository.createQueryBuilder('company');
    if (search) {
      queryBuilder.where('company.name LIKE :search OR company.address LIKE :search', { search: `%${search}%` });
    }
    const [companies, total] = await queryBuilder
      .skip(0)
      .take(10)
      .getManyAndCount();
    return {
      data: companies.map(this.mapToResponseDto),
      total,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(total / 10),
    };
  }

  async findOne(id: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return this.mapToResponseDto(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, updateCompanyDto);
    const updatedCompany = await this.companyRepository.save(company);
    return this.mapToResponseDto(updatedCompany);
  }

  async remove(id: string): Promise<void> {
    const result = await this.companyRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Company not found');
  }

  async addWarehouses(companyId: string, warehouseIds: string[]): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
    if (!company) throw new NotFoundException('Company not found');

  const warehouses = await this.warehouseRepository.findBy({ id: In(warehouseIds) });
  if (!warehouses || warehouses.length === 0) throw new NotFoundException('Warehouse not found');

   
   for (const warehouse of warehouses) {
    warehouse.company = company;
    await this.warehouseRepository.save(warehouse);
  }
    // Optionally reload company with updated warehouses
    const updatedCompany = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
    return this.mapToResponseDto(updatedCompany);
  }

  async getWarehouses(companyId: string): Promise<CompanyResponseDto> {
	const company = await this.companyRepository.findOne({ where: { id: companyId }, relations: ['warehouses'] });
	if (!company) throw new NotFoundException('Company not found');
	return this.mapToResponseDto(company);
  }

  private mapToResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      address: company.address,
      phoneNumber: company.phoneNumber,
      email: company.email,
      description: company.description,
	  warehouse: company.warehouses ? company.warehouses.map(warehouse => warehouse.id) : [],
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}