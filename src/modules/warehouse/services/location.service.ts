import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { User } from '../../users/entities/user.entity';

export interface LocationInfo {
  id: string;
  name: string;
  type: 'warehouse' | 'shop';
  managerId?: string;
  companyId: string;
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async getLocationInfo(locationId: string, locationType: 'warehouse' | 'shop'): Promise<LocationInfo> {
    if (locationType === 'warehouse') {
      const warehouse = await this.warehouseRepository.findOne({
        where: { id: locationId },
        relations: ['company']
      });
      if (!warehouse) {
        throw new Error(`Warehouse ${locationId} not found`);
      }
      return {
        id: warehouse.id,
        name: warehouse.name,
        type: 'warehouse',
        managerId: warehouse.manager?.id,
        companyId: warehouse.company?.id
      };
    } else {
      const shop = await this.shopRepository.findOne({
        where: { id: locationId },
        relations: ['company']
      });
      if (!shop) {
        throw new Error(`Shop ${locationId} not found`);
      }
      return {
        id: shop.id,
        name: shop.name,
        type: 'shop',
        managerId: shop.owner?.id,
        companyId: shop.company?.id
      };
    }
  }

  async validateLocationAccess(locationId: string, locationType: 'warehouse' | 'shop', user: User): Promise<LocationInfo> {
    const location = await this.getLocationInfo(locationId, locationType);
    
    // Check if user has access to this location
    const userCompanyId = user.company?.id || (user as any).companyId;
    if (user.role !== 'super_admin' && location.companyId !== userCompanyId) {
      throw new Error('Access denied to this location');
    }

    return location;
  }

  async isUserResponsibleForLocation(locationId: string, locationType: 'warehouse' | 'shop', user: User): Promise<boolean> {
    const location = await this.getLocationInfo(locationId, locationType);
    
    // Check if user is the manager/owner of this location
    if (location.managerId === user.id) {
      return true;
    }

    // Check if user is a company admin for this location's company
    const userCompanyId = user.company?.id || (user as any).companyId;
    if (user.role === 'company_admin' && location.companyId === userCompanyId) {
      return true;
    }

    // Check if user is a super admin
    if (user.role === 'super_admin') {
      return true;
    }

    return false;
  }
}
