import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, SettingsResponseDto } from './dto/settings.dto';
import { JwtAuthGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { ResponseDto } from '@/common/dto';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: SettingsResponseDto,
  })
  async getSettings(): Promise<ResponseDto<SettingsResponseDto>> {
    const settings = await this.settingsService.getSettings();
    return {
      success: true,
      message: 'Settings retrieved successfully',
      data: settings,
    };
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application settings' })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: SettingsResponseDto,
  })
  async updateSettings(
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<ResponseDto<SettingsResponseDto>> {
    const settings = await this.settingsService.updateSettings(updateSettingsDto);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    };
  }

  @Post('reset')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset settings to default values' })
  @ApiResponse({
    status: 200,
    description: 'Settings reset to defaults successfully',
    type: SettingsResponseDto,
  })
  async resetSettings(): Promise<ResponseDto<SettingsResponseDto>> {
    const settings = await this.settingsService.resetSettings();
    return {
      success: true,
      message: 'Settings reset to defaults successfully',
      data: settings,
    };
  }
}
