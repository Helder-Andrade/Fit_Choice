import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards, Request, Logger, BadRequestException, Get, Param, ParseIntPipe, NotFoundException } from "@nestjs/common";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { JwtAuthGuard } from "apps/auth-service/src/modules/auth/jwt-auth.guard";
import { RegisterGymDTO } from "apps/gym-service/src/dtos/registerGymDTO";
import { firstValueFrom } from "rxjs";

@Controller('gym')
export class GymController {
    constructor(@Inject("GYM_SERVICE") private readonly gymClient: ClientProxy) { }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async gymRegister(@Body() dto: RegisterGymDTO, @Request() req) {
        Logger.log('RegisterGymDTO:', dto);
        const userId = parseInt(req.user.userId);

        var response = await firstValueFrom(this.gymClient.send('register_gym', { dto, userId }));
        if (!response.success)
            throw new BadRequestException(response.message);

        return response;
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getGym(@Param('id', ParseIntPipe) id: number) {
        Logger.log('Get gym by id:', id);
        const result = await firstValueFrom(
            this.gymClient.send('get_gym_by_id', id)
        );

        if (result.success) {
            return result.payload;
        }

        throw new NotFoundException(result.message);
    }




}