import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';

@Injectable()
export class EmployeeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has employee role
    const employeeRoles = [
      UserRole.SHOP_EMPLOYEE,
      UserRole.WAREHOUSE_EMPLOYEE,
      UserRole.MANAGER,
      UserRole.COMPANY_ADMIN // Company admins can also access employee functions
    ];

    if (!employeeRoles.includes(user.role)) {
      throw new ForbiddenException('Employee access required');
    }

    // Check if user has employee ID in JWT (indicating they have an employee record)
    if (!user.employeeId) {
      throw new ForbiddenException('Employee record required');
    }

    return true;
  }
}
