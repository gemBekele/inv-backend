import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty()
  timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponseDto<T> extends ResponseDto<T[]> {
  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  constructor(
    success: boolean,
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    super(success, message, data);
    this.pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }
}
