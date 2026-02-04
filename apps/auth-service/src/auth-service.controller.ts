import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LoginDTO, RegisterUserDTO } from '@app/shared';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';


@Controller('auth')
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) { }


  @MessagePattern("auth-login")
  async login(@Payload() credentials: LoginDTO) {
    try {
      const access_token = await this.authService.login(credentials);
      return { success: true, payload: access_token }
    } catch (error) {
      return { success: false, message: error.message }
    }

  }

  @MessagePattern("auth-register")
  async register(@Payload() data: RegisterUserDTO) {
    return this.authService.register(data);
  }

  @MessagePattern('validate_user_exists')
  async validateUser(@Payload() userId: number) {
    try {
      const user = await this.authService.findById(userId);
      return { exists: user !== null && user !== undefined };
    } catch (error) {
      return { exists: false }
    }

  }
}
