import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { StaffPermissions } from './entities/staff-permissions.entity';
import { UpdateSettingsDto, SettingsResponseDto } from './dto/settings.dto';
import { StaffMemberDto, StaffPermissionsDto } from './dto/staff-permissions.dto';
import { User } from '../users/entities/user.entity';
import { CACHE_KEYS } from '../../common/constants';
import { CacheService } from '@/shared/cache/cache.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    @InjectRepository(StaffPermissions)
    private readonly staffPermissionsRepository: Repository<StaffPermissions>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
   * Get staff member with permissions
   */
  async getStaffMember(userId: string): Promise<StaffMemberDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'shop', 'warehouse'],
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    const permissions = await this.getStaffPermissions(userId);

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      branch: user.shop?.name || user.warehouse?.name || user.company?.name,
      permissions,
    };
  }

  /**
   * Get staff permissions
   */
  async getStaffPermissions(userId: string): Promise<StaffPermissionsDto> {
    let staffPermissions = await this.staffPermissionsRepository.findOne({
      where: { userId },
    });

    if (!staffPermissions) {
      // Create default permissions
      staffPermissions = this.staffPermissionsRepository.create({
        userId,
        featureAccess: {
          manageItem: false,
          manageAttribute: false,
          managePartner: false,
          manageLocation: false,
          stockIn: false,
          stockOut: false,
          adjust: false,
          moveStock: false,
          manageStockInDraft: false,
          manageStockOutDraft: false,
        },
        itemAttributeAccess: {
          type: false,
          brand: false,
        },
      });
      await this.staffPermissionsRepository.save(staffPermissions);
    }

    return {
      featureAccess: staffPermissions.featureAccess,
      itemAttributeAccess: staffPermissions.itemAttributeAccess,
    };
  }

  /**
   * Update staff permissions
   */
  async updateStaffPermissions(userId: string, permissions: StaffPermissionsDto): Promise<StaffPermissionsDto> {
    let staffPermissions = await this.staffPermissionsRepository.findOne({
      where: { userId },
    });

    if (!staffPermissions) {
      staffPermissions = this.staffPermissionsRepository.create({
        userId,
        ...permissions,
      });
    } else {
      Object.assign(staffPermissions, permissions);
    }

    await this.staffPermissionsRepository.save(staffPermissions);
    this.logger.log(`Updated permissions for user ${userId}`);

    return {
      featureAccess: staffPermissions.featureAccess,
      itemAttributeAccess: staffPermissions.itemAttributeAccess,
    };
  }

  /**
   * Remove staff member
   */
  async removeStaffMember(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    // Remove permissions first
    await this.staffPermissionsRepository.delete({ userId });
    
    // Remove user
    await this.userRepository.remove(user);
    this.logger.log(`Removed staff member ${userId}`);
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
