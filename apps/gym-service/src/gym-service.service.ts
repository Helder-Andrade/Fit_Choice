import { Injectable } from '@nestjs/common';

@Injectable()
export class GymServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
