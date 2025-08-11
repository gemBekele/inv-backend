import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { mockUser, mockAuthResult } from '../../../test/setup';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config = {
                'JWT_REFRESH_SECRET': 'refresh-secret',
                'JWT_REFRESH_EXPIRES_IN': '7d',
                'BCRYPT_ROUNDS': '12',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign
        .mockReturnValueOnce(expectedTokens.accessToken)
        .mockReturnValueOnce(expectedTokens.refreshToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        ...expectedTokens,
        user: { ...mockUser, password: undefined },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      const hashedPassword = 'hashed-password';
      const newUser = { ...mockUser, ...registerDto, password: hashedPassword };
      
      usersService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      usersService.create.mockResolvedValue(newUser as any);
      jwtService.sign.mockReturnValue('access-token').mockReturnValue('refresh-token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
        role: 'user',
        isEmailVerified: false,
      });
      expect(result).toEqual(newUser);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: '1', email: 'test@example.com' };
      const newAccessToken = 'new-access-token';
      
      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue(newAccessToken);

      const result = await service.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({ accessToken: newAccessToken });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';
      
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});
