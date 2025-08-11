import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, UserStatus } from '../src/common/enums';

// Global test setup
jest.setTimeout(30000);

// Mock repository factory
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  findByIds: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  preload: jest.fn(),
  merge: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  count: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
  })),
});

// Helper function to create test module with common providers
export const createTestingModuleWithConfig = (providers: any[] = []) => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
    ],
    providers,
  });
};

// Mock user data for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  isEmailVerified: true,
  fullName: 'Test User',
  employees: [],
  shops: [],
  warehouses: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  hashPassword: jest.fn(),
  validatePassword: jest.fn().mockResolvedValue(true),
  emailToLowerCase: jest.fn(),
};

// Mock JWT payload
export const mockJwtPayload = {
  sub: '1',
  email: 'test@example.com',
  role: 'USER',
};

// Mock authentication result
export const mockAuthResult = {
  access_token: 'mock-jwt-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser,
};

// Mock user factory function
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
});

// Mock pagination result
export const createMockPaginationResult = <T>(data: T[]) => ({
  data,
  meta: {
    total: data.length,
    page: 1,
    limit: 10,
    totalPages: Math.ceil(data.length / 10),
  },
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
