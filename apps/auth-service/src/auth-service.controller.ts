import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { RegisterUserDTO } from './dtos/registerDTO';
import { LoginDTO } from './dtos/loginDTO';
import { STATUS_CODES } from 'http';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) { }

 /**
  * Used to register a new user
  * @param registerUserDTO data transfer object for register 
  * @returns payload with created user info
  * @HttpCode 200 if susseful Login, 400 if invalid credentials
  */
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @HttpCode(HttpStatus.BAD_REQUEST)
  async register(@Body() registerUserDTO: RegisterUserDTO) {
    try {
      const user = await this.authService.register(registerUserDTO);
      const { password_hash, ...result } = user;
      return {statusCode: HttpStatus.CREATED, payload:result};
    } catch (error) {
      return {statusCode: HttpStatus.BAD_REQUEST, message:error.message}
    }
  }

  /**
   * Used to login a user
   * @param LoginDTO data transfer object for login with email and password
   * @returns payload with JWT token
   * @HttpCode 200 if susseful Login, 404 if invalid credentials
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.NOT_FOUND)
  async login(@Body() LoginDTO: LoginDTO) {
    try {
      var payload = await this.authService.login(LoginDTO);
      return {
        statusCode: HttpStatus.OK, payload: payload
      }
    } catch (err) {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'Invalid credentials' };
    }


  }

}
