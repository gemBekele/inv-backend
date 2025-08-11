import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { UpdateSettingsDto, SettingsResponseDto } from './dto/settings.dto';
import { CACHE_KEYS } from '../../common/constants';
import { CacheService } from '@/shared/cache/cache.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get application settings
   * Creates default settings if none exist
   */
  async getSettings(): Promise<SettingsResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SETTINGS);
    
    // Try to get from cache
    const cached = await this.cacheService.get<SettingsResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for settings');
      return cached;
    }

    let settings = await this.settingsRepository.findOne({ where: {} });

    // Create default settings if none exist
    if (!settings) {
      this.logger.log('No settings found, creating default settings');
      settings = this.settingsRepository.create({});
      await this.settingsRepository.save(settings);
    }

    const result = this.mapToResponseDto(settings);

    // Cache the result for 10 minutes
    await this.cacheService.set(cacheKey, result, 600000);

    return result;
  }

  /**
   * Update application settings
   */
  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<SettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      // Create new settings if none exist
      settings = this.settingsRepository.create(updateSettingsDto);
    } else {
      // Update existing settings
      Object.assign(settings, updateSettingsDto);
    }

    const updatedSettings = await this.settingsRepository.save(settings);

    // Invalidate cache
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SETTINGS);
    await this.cacheService.del(cacheKey);

    this.logger.log('Settings updated successfully');

    return this.mapToResponseDto(updatedSettings);
  }

  /**
   * Reset settings to default values
   */
  async resetSettings(): Promise<SettingsResponseDto> {
    // Delete existing settings
    await this.settingsRepository.delete({});

    // Create new default settings
    const defaultSettings = this.settingsRepository.create({});
    const savedSettings = await this.settingsRepository.save(defaultSettings);

    // Invalidate cache
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SETTINGS);
    await this.cacheService.del(cacheKey);

    this.logger.log('Settings reset to defaults');

    return this.mapToResponseDto(savedSettings);
  }

  /**
   * Get specific setting value by key
   */
  async getSettingValue<T = any>(key: keyof Settings): Promise<T> {
    const settings = await this.getSettings();
    return settings[key] as T;
  }

  /**
   * Update specific setting value
   */
  async updateSettingValue(key: keyof Settings, value: any): Promise<SettingsResponseDto> {
    const updateDto = { [key]: value } as UpdateSettingsDto;
    return this.updateSettings(updateDto);
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureKey: keyof Settings): Promise<boolean> {
    const value = await this.getSettingValue<boolean>(featureKey);
    return Boolean(value);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(settings: Settings): SettingsResponseDto {
    const dto = new SettingsResponseDto();
    Object.assign(dto, settings);
    return dto;
  }
}
