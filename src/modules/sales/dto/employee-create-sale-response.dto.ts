import { ApiProperty } from '@nestjs/swagger';
import { SaleResponseDto } from './sales-response.dto';

class CustomerInfoDto {
  @ApiProperty({ description: 'Customer type', example: 'customer' })
  type: string;

  @ApiProperty({ description: 'Customer ID', example: 'customer-uuid' })
  id: string;

  @ApiProperty({ description: 'Customer name', example: 'Jane Smith' })
  name: string;

  @ApiProperty({ description: 'Customer phone', example: '+251911234567' })
  phone: string;

  @ApiProperty({ description: 'Customer address', example: '123 Main St' })
  address?: string;
}

class EmployeeInfoDto {
  @ApiProperty({ description: 'Employee ID', example: 'employee-uuid' })
  id: string;

  @ApiProperty({ description: 'Shop information', required: false })
  shop?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Warehouse information', required: false })
  warehouse?: {
    id: string;
    name: string;
  };
}

class CommissionDetailDto {
  @ApiProperty({ description: 'Product ID', example: 'product-uuid-1' })
  productId: string;

  @ApiProperty({ description: 'Product name', example: 'Product A' })
  productName: string;

  @ApiProperty({ description: 'Sale item ID', example: 'item-uuid-1' })
  saleItemId: string;

  @ApiProperty({ description: 'Quantity sold', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Item total amount', example: 100.00 })
  itemTotal: number;

  @ApiProperty({ description: 'Commission rate percentage', example: 5.0 })
  commissionRate: number;

  @ApiProperty({ description: 'Commission amount earned', example: 5.00 })
  commissionAmount: number;

  @ApiProperty({ description: 'Commission status', example: 'calculated' })
  status: string;
}

class CommissionInfoDto {
  @ApiProperty({ description: 'Sale ID', example: 'sale-uuid' })
  saleId: string;

  @ApiProperty({ description: 'Employee ID', example: 'employee-uuid' })
  employeeId: string;

  @ApiProperty({ description: 'Employee name', example: 'John Doe' })
  employeeName: string;

  @ApiProperty({ description: 'Total sale amount', example: 150.00 })
  totalSaleAmount: number;

  @ApiProperty({ description: 'Total commission amount', example: 7.50 })
  totalCommissionAmount: number;

  @ApiProperty({ description: 'Commission details per product', type: [CommissionDetailDto] })
  commissionDetails: CommissionDetailDto[];

  @ApiProperty({ description: 'Calculation timestamp', example: '2023-01-01T10:30:00Z' })
  calculatedAt: Date;
}

class LocationInfoDto {
  @ApiProperty({ description: 'Location ID', example: 'location-uuid' })
  id: string;

  @ApiProperty({ description: 'Location name', example: 'Downtown Branch' })
  name: string;

  @ApiProperty({ description: 'Location address', example: 'City Center' })
  location?: string;
}

class EmployeeContextDto {
  @ApiProperty({ description: 'User ID', example: 'user-uuid' })
  userId: string;

  @ApiProperty({ description: 'Employee ID', example: 'employee-uuid' })
  employeeId: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'warehouse-uuid' })
  warehouseId: string;

  @ApiProperty({ description: 'Shop ID', example: 'shop-uuid', required: false })
  shopId?: string;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  companyId: string;

  @ApiProperty({ description: 'Employee role', example: 'shop_employee' })
  role: string;

  @ApiProperty({ description: 'Employee permissions' })
  permissions: {
    canCreateSales: boolean;
    canViewCommissions: boolean;
    canProcessPayments: boolean;
  };
}

class EmployeeCreateSaleDataDto {
  @ApiProperty({ description: 'Created sale information', type: SaleResponseDto })
  sale: SaleResponseDto;

  @ApiProperty({ description: 'Customer information', type: CustomerInfoDto })
  customer: CustomerInfoDto;

  @ApiProperty({ description: 'Employee information', type: EmployeeInfoDto })
  employee: EmployeeInfoDto;

  @ApiProperty({ description: 'Commission information', type: CommissionInfoDto })
  commissions: CommissionInfoDto;

  @ApiProperty({ description: 'Warehouse information', type: LocationInfoDto })
  warehouse: LocationInfoDto;

  @ApiProperty({ description: 'Shop information', type: LocationInfoDto, required: false })
  shop?: LocationInfoDto;

  @ApiProperty({ description: 'Employee context information', type: EmployeeContextDto })
  employeeContext: EmployeeContextDto;
}

export class EmployeeCreateSaleResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({ 
    description: 'Success message', 
    example: 'Sale created successfully by employee with auto-calculated commissions' 
  })
  message: string;

  @ApiProperty({ description: 'Sale creation data', type: EmployeeCreateSaleDataDto })
  data: EmployeeCreateSaleDataDto;
}
