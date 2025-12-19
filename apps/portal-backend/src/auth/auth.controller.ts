import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { LoginDTO } from "apps/auth-service/src/dtos/loginDTO";
import { RegisterUserDTO } from "apps/auth-service/src/dtos/registerDTO";
import { firstValueFrom } from "rxjs";

@Controller('auth')
export class AuthController {
    constructor(@Inject("AUTH_SERVICE") private readonly authClient: ClientProxy) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() LoginDTO: LoginDTO) {
        var response = await firstValueFrom(this.authClient.send('auth-login', LoginDTO));

        return response;
    }


    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async registerx(@Body() registerUserDTO: RegisterUserDTO) {
        try {
            const result = await firstValueFrom(this.authClient.send('auth-register', registerUserDTO));
            return { statusCode: HttpStatus.CREATED, payload: result };
        } catch (error) {
            return { statusCode: HttpStatus.BAD_REQUEST, message: error.message }
        }
    }

}