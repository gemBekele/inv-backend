import { SelectQueryBuilder } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

export interface MultiTenantUser {
  id: string;
  role: UserRole;
  companyId?: string;
}

export abstract class BaseMultiTenantService {
  /**
   * Applies company filtering to a query builder based on user role
   * Super admins can access all data, other users are restricted to their company
   */
  protected applyCompanyFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    user: MultiTenantUser,
    entityAlias: string = 'entity'
  ): SelectQueryBuilder<T> {
    // Super admins can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return queryBuilder;
    }

    // All other users are restricted to their company
    if (user.companyId) {
      queryBuilder.andWhere(`${entityAlias}.companyId = :userCompanyId`, {
        userCompanyId: user.companyId,
      });
    } else {
      // If user has no company, they can't see any data
      queryBuilder.andWhere('1 = 0'); // This ensures no results are returned
    }

    return queryBuilder;
  }

  /**
   * Validates that the user can access data for the specified company
   */
  protected validateCompanyAccess(
    user: MultiTenantUser,
    targetCompanyId: string
  ): void {
    // Super admins can access any company
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Other users can only access their own company
    if (user.companyId !== targetCompanyId) {
      throw new Error('Access denied: Cannot access data for other companies');
    }
  }

  /**
   * Ensures entity creation includes the correct company context
   */
  protected setCompanyContext<T extends { companyId?: string }>(
    entityData: T,
    user: MultiTenantUser
  ): T {
    // Super admins must explicitly set companyId in the request
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!entityData.companyId) {
        throw new Error('Super admin must specify companyId when creating entities');
      }
      return entityData;
    }

    // For all other users, use their company from JWT token
    if (!user.companyId) {
      throw new Error('User must be assigned to a company to create entities');
    }

    return {
      ...entityData,
      companyId: user.companyId,
    };
  }

  /**
   * Checks if the user belongs to the specified company or is a super admin
   */
  protected canAccessCompany(
    user: MultiTenantUser,
    companyId: string
  ): boolean {
    return user.role === UserRole.SUPER_ADMIN || user.companyId === companyId;
  }
}
