import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        
        // Don't wrap already wrapped responses
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return new ResponseDto(
          statusCode < 400,
          statusCode < 400 ? 'Success' : 'Error',
          data,
        );
      }),
    );
  }
}