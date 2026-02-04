// transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, NotFoundException, BadRequestException } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  // We pass the DTO we want to use as a parameter
  constructor(private readonly dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        // 1. Handle Microservice Errors
        if (!response.success) {
            
          throw new BadRequestException(response.message || 'Operation failed');
        }

        // 2. Automatically transform payload to the provided DTO
        return plainToInstance(this.dto, response.payload, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        });
      }),
    );
  }
}