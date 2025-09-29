import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings } from './entities/settings.entity';
import { StaffPermissions } from './entities/staff-permissions.entity';
import { User } from '../users/entities/user.entity';
import { CacheService } from '@/shared/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Settings, StaffPermissions, User])],
  controllers: [SettingsController],
  providers: [SettingsService, CacheService],
  exports: [SettingsService]
})
export class SettingsModule {}
