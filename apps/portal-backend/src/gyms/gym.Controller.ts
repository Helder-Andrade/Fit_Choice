import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards, Request, Logger, BadRequestException, Get, Param, ParseIntPipe, NotFoundException, Query, InternalServerErrorException, Patch, Req } from "@nestjs/common";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { JwtAuthGuard } from "apps/auth-service/src/modules/auth/jwt-auth.guard";
import { RegisterGymDTO } from "apps/gym-service/src/dtos/registerGymDTO";
import { GymRolesGuard } from "apps/gym-service/src/modules/auth/gym-roles.guard";
import { firstValueFrom } from "rxjs";

@Controller('gym')
export class GymController {
    constructor(@Inject("GYM_SERVICE") private readonly gymClient: ClientProxy) { }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async gymRegister(@Body() dto: RegisterGymDTO, @Req() req) {
        Logger.log('RegisterGymDTO:', dto);
        const userId = parseInt(req.user.userId);

        var response = await firstValueFrom(this.gymClient.send('register_gym', { dto, userId }));
        if (!response.success)
            throw new BadRequestException(response.message);

        return response;
    }

    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    async updateGym(@Param('id') gymId: string, @Body() dto: RegisterGymDTO, @Req() req) {

        
        const payload = {
            gymId: Number(gymId),     
            userId: req.user.userId, 
            dto: dto             
        };

        return this.gymClient.send('update_gym', payload);
    }



    @UseGuards(JwtAuthGuard)
    @Get('getAll')
    async getGyms() {
        Logger.log('Get allGyms');
        const result = await firstValueFrom(
            this.gymClient.send('get_all_gyms', {})
        );

        if (result.success) {
            return result.payload;
        }

        throw new NotFoundException(result.message);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getById/:id')
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

    @Get('getByDistance')
    async searchGyms(
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('km') km?: number,
    ) {
        const result = await firstValueFrom(
            this.gymClient.send('search_gyms_by_location', {
                latitude: Number(lat),
                longitude: Number(lng),
                distanceKm: km ? Number(km) : 25
            })
        );

        if (result.success) {
            return result.payload;
        }

        throw new InternalServerErrorException(result.message);
    }






}