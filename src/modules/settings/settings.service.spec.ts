import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { CacheService } from '@/shared/cache/cache.service';
import { createMockRepository } from '../../../test/setup';

describe('SettingsService', () => {
  let service: SettingsService;
  let settingsRepository: jest.Mocked<Repository<Settings>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockSettings = {
    id: '1',
    companyName: 'Test Company',
    companyEmail: 'test@company.com',
    companyPhone: '1234567890',
    currency: 'USD',
    taxRate: 0.1,
    enableNotifications: true,
    enableLoyaltyProgram: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Settings),
          useValue: createMockRepository(),
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            generateKey: jest.fn((...args: any[]) => args.join('_')),
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    settingsRepository = module.get(getRepositoryToken(Settings));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return cached settings if available', async () => {
      cacheService.get.mockResolvedValue(mockSettings as any);

      const result = await service.getSettings();

      expect(cacheService.get).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
      expect(settingsRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return settings from database and cache them', async () => {
      cacheService.get.mockResolvedValue(null);
      settingsRepository.findOne.mockResolvedValue(mockSettings as any);

      const result = await service.getSettings();

      expect(settingsRepository.findOne).toHaveBeenCalledWith({ where: {} });
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ companyName: mockSettings.companyName }),
        600000
      );
      expect(result).toEqual(expect.objectContaining({
        companyName: mockSettings.companyName,
      }));
    });

    it('should create default settings if none exist', async () => {
      cacheService.get.mockResolvedValue(null);
      settingsRepository.findOne.mockResolvedValue(null);
      settingsRepository.create.mockReturnValue(mockSettings as any);
      settingsRepository.save.mockResolvedValue(mockSettings as any);

      const result = await service.getSettings();

      expect(settingsRepository.create).toHaveBeenCalledWith({});
      expect(settingsRepository.save).toHaveBeenCalledWith(mockSettings);
      expect(result).toEqual(expect.objectContaining({
        companyName: mockSettings.companyName,
      }));
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      const updateDto = { companyName: 'Updated Company' };
      const updatedSettings = { ...mockSettings, ...updateDto };

      settingsRepository.findOne.mockResolvedValue(mockSettings as any);
      settingsRepository.save.mockResolvedValue(updatedSettings as any);

      const result = await service.updateSettings(updateDto);

      expect(settingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
      expect(cacheService.del).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        companyName: 'Updated Company',
      }));
    });

    it('should create new settings if none exist', async () => {
      const updateDto = { companyName: 'New Company' };

      settingsRepository.findOne.mockResolvedValue(null);
      settingsRepository.create.mockReturnValue(mockSettings as any);
      settingsRepository.save.mockResolvedValue(mockSettings as any);

      const result = await service.updateSettings(updateDto);

      expect(settingsRepository.create).toHaveBeenCalledWith(updateDto);
      expect(settingsRepository.save).toHaveBeenCalledWith(mockSettings);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      settingsRepository.create.mockReturnValue(mockSettings as any);
      settingsRepository.save.mockResolvedValue(mockSettings as any);

      const result = await service.resetSettings();

      expect(settingsRepository.delete).toHaveBeenCalledWith({});
      expect(settingsRepository.create).toHaveBeenCalledWith({});
      expect(settingsRepository.save).toHaveBeenCalledWith(mockSettings);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('getSettingValue', () => {
    it('should return specific setting value', async () => {
      const freshMockSettings = {
        id: '1',
        companyName: 'Test Company',
        companyEmail: 'test@company.com',
        companyPhone: '1234567890',
        currency: 'USD',
        taxRate: 0.1,
        enableNotifications: true,
        enableLoyaltyProgram: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(service, 'getSettings').mockResolvedValue(freshMockSettings as any);

      const result = await service.getSettingValue('companyName');

      expect(result).toBe('Test Company');
    });
  });

  describe('updateSettingValue', () => {
    it('should update specific setting value', async () => {
      jest.spyOn(service, 'updateSettings').mockResolvedValue(mockSettings as any);

      const result = await service.updateSettingValue('companyName', 'New Name');

      expect(service.updateSettings).toHaveBeenCalledWith({ companyName: 'New Name' });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return boolean value for feature flag', async () => {
      jest.spyOn(service, 'getSettingValue').mockResolvedValue(true);

      const result = await service.isFeatureEnabled('enableLowStockNotifications');

      expect(result).toBe(true);
    });
  });
});
