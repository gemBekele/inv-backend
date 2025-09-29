import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
  Delete,
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
import { StaffMemberDto, UpdateStaffPermissionsDto } from './dto/staff-permissions.dto';
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

  @Get('staff/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get staff member details and permissions' })
  @ApiResponse({
    status: 200,
    description: 'Staff member retrieved successfully',
    type: StaffMemberDto,
  })
  async getStaffMember(@Param('userId') userId: string): Promise<ResponseDto<StaffMemberDto>> {
    const staff = await this.settingsService.getStaffMember(userId);
    return {
      success: true,
      message: 'Staff member retrieved successfully',
      data: staff,
    };
  }

  @Get('staff/:userId/permissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get staff member permissions' })
  @ApiResponse({
    status: 200,
    description: 'Staff permissions retrieved successfully',
  })
  async getStaffPermissions(@Param('userId') userId: string): Promise<ResponseDto<any>> {
    const permissions = await this.settingsService.getStaffPermissions(userId);
    return {
      success: true,
      message: 'Staff permissions retrieved successfully',
      data: permissions,
    };
  }

  @Put('staff/:userId/permissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update staff member permissions' })
  @ApiBody({ type: UpdateStaffPermissionsDto })
  @ApiResponse({
    status: 200,
    description: 'Staff permissions updated successfully',
  })
  async updateStaffPermissions(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateStaffPermissionsDto,
  ): Promise<ResponseDto<any>> {
    const permissions = await this.settingsService.updateStaffPermissions(userId, updateDto.permissions);
    return {
      success: true,
      message: 'Staff permissions updated successfully',
      data: permissions,
    };
  }

  @Delete('staff/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove staff member' })
  @ApiResponse({
    status: 200,
    description: 'Staff member removed successfully',
  })
  async removeStaffMember(@Param('userId') userId: string): Promise<ResponseDto<void>> {
    await this.settingsService.removeStaffMember(userId);
    return {
      success: true,
      message: 'Staff member removed successfully',
    };
  }
}
