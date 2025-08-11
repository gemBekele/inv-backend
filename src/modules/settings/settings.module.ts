import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings } from './entities/settings.entity';
import { CacheService } from '@/shared/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [SettingsService, CacheService],
  exports: [SettingsService]
})
export class SettingsModule {}
