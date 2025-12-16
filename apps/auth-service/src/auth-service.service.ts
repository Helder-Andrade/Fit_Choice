import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './modules/user.entity';
import { LoginDTO } from './dtos/loginDTO';
import { RegisterUserDTO } from './dtos/registerDTO';

@Injectable()
export class AuthServiceService {

  constructor(
    @InjectRepository(User, 'authConnection')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }


  /**
   * Hashes a password
   * @param password password to be hashed
   * @returns hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Checks if credentials are valid
   * @param email user email
   * @param pass user password
   * @returns used data if credentials are valid, null otherwise
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ email });
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Registers a new user
   * @param RegisterUserDTO dto used to transfer data needed for registering a user
   * @returns User object
   * @throws UnauthorizedException if email is already in use
   */
  async register(RegisterUserDTO: RegisterUserDTO): Promise<User> {
    // grabs data from dto
    const { email, password, name, country_code, phone_number } = RegisterUserDTO;
    
    // checks if email is already in use
    const exists = await this.userRepository.findOneBy({ email});
    if (exists) {
      throw new UnauthorizedException('Email already in use');
    }

    // hashes password
    const password_hash = await this.hashPassword(password);

    // creates new user
    const newUser = this.userRepository.create({
      email,
      password_hash,
      name,
      country_code: country_code || null,
      phone_number: phone_number || null,
      is_Active: true,
    })

    // returns saved user data
    return this.userRepository.save(newUser);
  }

  /**
   * Logs in a user and returns JWT token
   * @param loginDTO dto used to transfer data needed for login
   * @returns payload with JWT token
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDTO: LoginDTO): Promise<{ access_token: string }> {
    // grabs data from dto
    const { email, password } = loginDTO;

    // validates user credentials
    const user = await this.validateUser(email, password);
    if(!user){
      throw new UnauthorizedException('Invalid credentials');
    }

    // creates JWT payload
    const payload = { email: user.email, sub: user.id, role: user.role };

    // returns JWT token with payload
    return{
      access_token: this.jwtService.sign(payload),
    }
    
  }

}
