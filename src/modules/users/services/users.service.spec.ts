import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockRepository, mockUser, createMockPaginationResult, createMockUser } from '../../../../test/setup';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../../../common/enums';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUsers = [
    mockUser,
    {
      ...mockUser,
      id: '2',
      email: 'user2@example.com',
      firstName: 'User',
      lastName: 'Two',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      const newUser = { ...mockUser, ...createUserDto };

      repository.create.mockReturnValue(newUser as any);
      repository.save.mockResolvedValue(newUser as any);

      const result = await service.create(createUserDto);

      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query = Object.assign(new PaginationDto(), { page: 1, limit: 10 });
      const expectedResult = { users: mockUsers, total: mockUsers.length };

      repository.findAndCount.mockResolvedValue([mockUsers as any[], mockUsers.length]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      repository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findById('1');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { id: '1' },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'phone', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      repository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateDto };

      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedUser as any);

      const currentUser = createMockUser({ id: '1' });
      const result = await service.update('1', updateDto, currentUser);

      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { id: '1' },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'isEmailVerified', 'phone', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException if user tries to update another user', async () => {
      const currentUser = createMockUser({ id: '1', role: UserRole.USER });
      
      await expect(service.update('2', {}, currentUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      const currentUser = createMockUser({ id: '1', role: UserRole.ADMIN });
      await service.remove('2', currentUser);

      expect(repository.delete).toHaveBeenCalledWith('2');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      const currentUser = createMockUser({ id: '1', role: UserRole.ADMIN });
      await expect(service.remove('nonexistent', currentUser)).rejects.toThrow(NotFoundException);
    });
  });

});
