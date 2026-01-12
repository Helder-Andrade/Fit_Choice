import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Inject, Logger, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RegisterClientDTO } from "apps/gym-service/src/dtos/registerClientDTO";
import { firstValueFrom } from "rxjs";

@Controller('gym_user')
export class GymUserControllerPB {
    constructor(@Inject("GYM_SERVICE") private readonly gymUserClient: ClientProxy) { }

    @UseGuards(JwtAuthGuard)
    @Post('register_user/:id')
    @HttpCode(HttpStatus.CREATED)
    async addClinet(@Param('id') gymId: string, @Body() dto: RegisterClientDTO, @Req() req) {
        try {
            if (!dto) {
                throw new BadRequestException('Request body is missing');
            }
            Logger.log(`GymUserControllerPB: Registering User ${dto.userId} to Gym ${gymId} with the dto ${JSON.stringify(dto)}`);
            const payload = {
                gymId: Number(gymId),
                userId: req.user.userId,
                targetUser: dto
            };
            return await firstValueFrom(this.gymUserClient.send('register_user_in_gym', payload));
        } catch (error) {
            throw error;
        }
    }
}
