import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto, BranchQueryDto, BranchResponseDto } from './dto/branch.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    // Check if branch name already exists within the same company
    const existingBranch = await this.branchRepository.findOne({
      where: { 
        name: createBranchDto.name,
        companyId: createBranchDto.companyId 
      }
    });

    if (existingBranch) {
      throw new ConflictException('Branch with this name already exists in the company');
    }

    const branch = this.branchRepository.create(createBranchDto);
    const savedBranch = await this.branchRepository.save(branch);
    
    return this.mapToResponseDto(savedBranch);
  }

  async findAll(query: BranchQueryDto): Promise<PaginatedResult<BranchResponseDto>> {
    const { page = 1, limit = 10, search, isActive, companyId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.company', 'company')
      .skip(skip)
      .take(limit)
      .orderBy('branch.createdAt', 'DESC');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(branch.name ILIKE :search OR branch.address ILIKE :search OR branch.manager ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', { isActive });
    }

    if (companyId) {
      queryBuilder.andWhere('branch.companyId = :companyId', { companyId });
    }

    const [branches, total] = await queryBuilder.getManyAndCount();

    return {
      data: branches.map(branch => this.mapToResponseDto(branch)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  }

  async findOne(id: string): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.mapToResponseDto(branch);
  }

  async findByCompany(companyId: string): Promise<BranchResponseDto[]> {
    const branches = await this.branchRepository.find({
      where: { companyId, isActive: true },
      relations: ['company'],
      order: { name: 'ASC' }
    });

    return branches.map(branch => this.mapToResponseDto(branch));
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.findOne({ where: { id } });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check for name conflict if name is being updated
    if (updateBranchDto.name && updateBranchDto.name !== branch.name) {
      const existingBranch = await this.branchRepository.findOne({
        where: { 
          name: updateBranchDto.name,
          companyId: branch.companyId
        }
      });

      if (existingBranch && existingBranch.id !== id) {
        throw new ConflictException('Branch with this name already exists in the company');
      }
    }

    Object.assign(branch, updateBranchDto);
    const updatedBranch = await this.branchRepository.save(branch);
    
    return this.findOne(updatedBranch.id);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['sales']
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if branch has associated sales records
    if (branch.sales && branch.sales.length > 0) {
      throw new BadRequestException('Cannot delete branch with existing sales records. Consider deactivating instead.');
    }

    await this.branchRepository.softDelete(id);
  }

  async activate(id: string): Promise<BranchResponseDto> {
    await this.updateStatus(id, true);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<BranchResponseDto> {
    await this.updateStatus(id, false);
    return this.findOne(id);
  }

  private async updateStatus(id: string, isActive: boolean): Promise<void> {
    const result = await this.branchRepository.update(id, { isActive });
    
    if (result.affected === 0) {
      throw new NotFoundException('Branch not found');
    }
  }

  private mapToResponseDto(branch: Branch): BranchResponseDto {
    const dto = new BranchResponseDto();
    Object.assign(dto, branch);
    
    if (branch.company) {
      dto.company = {
        id: branch.company.id,
        name: branch.company.name
      };
    }

    return dto;
  }
}
