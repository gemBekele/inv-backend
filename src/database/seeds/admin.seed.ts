import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
      const adminFirstName = this.configService.get<string>('ADMIN_FIRST_NAME');
      const adminLastName = this.configService.get<string>('ADMIN_LAST_NAME');

      if (!adminEmail || !adminPassword) {
        this.logger.warn('Admin credentials not found in environment variables');
        return;
      }

      // Check if admin user already exists
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(
        adminPassword,
        parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '12')),
      );

      const adminUser = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName || 'Admin',
        lastName: adminLastName || 'User',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });

      await this.userRepository.save(adminUser);
      this.logger.log('Admin user created successfully');
    } catch (error) {
      this.logger.error('Error creating admin user:', error);
      throw error;
    }
  }
}