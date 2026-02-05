import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HyperRpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    Logger.error(`Exception caught in HyperRpcExceptionFilter: ${exception.message || exception}`, exception.stack);
    
    // 1. Determine the status
    let status = exception instanceof HttpException
      ? exception.getStatus()
      : (exception.status || exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);

    // 2. Determine the message
    let message = exception.message || 'Internal Server Error';

    // Handle cases where the exception is the object we sent from the Microservice
    if (exception.error && typeof exception.error === 'object') {
      status = exception.error.status || status;
      message = exception.error.message || message;
    }

    // Ensure status is a valid HTTP status code (must be between 100-599)
    if (typeof status !== 'number' || status < 100 || status > 599) {
      status = 500;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}