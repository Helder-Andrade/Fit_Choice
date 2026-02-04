import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards, Request, Logger, BadRequestException, Get, Param, ParseIntPipe, NotFoundException, Query, InternalServerErrorException, Patch, Req, HttpException, UseInterceptors, UploadedFiles, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Delete } from "@nestjs/common";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { JwtAuthGuard } from "@app/auth";
import { RegisterGymDTO } from "@app/shared/dtos/gyms/registerGymDTO";
import { firstValueFrom } from "rxjs";
import { StorageService } from "../../../../libs/storage/src/storage.service";
import { plainToInstance } from "class-transformer";
import { getGymDTO } from "@app/shared";
import { ResponseTransformInterceptor } from "../filters/service_response.filter";

@Controller('gym')
export class GymController {
    constructor(@Inject("GYM_SERVICE") private readonly gymClient: ClientProxy, private readonly storageService: StorageService) { }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async gymRegister(
        @Body() dto: RegisterGymDTO,
        @Req() req
    ) {
        Logger.log(`Registering gym with data: ${JSON.stringify(dto)}`);
        const userId = parseInt(req.user.userId);
        if (isNaN(userId)) {
            throw new BadRequestException('Invalid User ID in token');
        }
        const payload = {
            dto: {
                ...dto,
                // Ensure coordinates are numbers
                latitude: dto.latitude ? Number(dto.latitude) : undefined,
                longitude: dto.longitude ? Number(dto.longitude) : undefined,
                logo_url: null,
                images_urls: []
            },
            userId
        };

        // Microservice Communication
        try {
            const response = await firstValueFrom(this.gymClient.send('register_gym', payload));

            if (!response || !response.success) {
                throw new BadRequestException(response?.message || 'Failed to register gym');
            }
            return response;

        } catch (error) {
            Logger.error(`Gym Registration failed: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(error.message);
        }
    }



    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    async updateGym(
        @Param('id') gymId: string,
        @Body() dto: RegisterGymDTO,
        @Req() req
    ) {
        const payload = {
            gymId: Number(gymId),
            userId: req.user.userId,
            dto: {
                ...dto,
                latitude: dto.latitude ? Number(dto.latitude) : undefined,
                longitude: dto.longitude ? Number(dto.longitude) : undefined,
            }
        };

        // Microservice Communication
        try {
            return await firstValueFrom(this.gymClient.send('update_gym', payload));
        } catch (error) {
            Logger.error(`Gym Update failed: ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    async deleteGym(@Param('id', ParseIntPipe) gymId: number, @Req() req) {
        const response = await firstValueFrom(this.gymClient.send('get_gym_by_id', gymId));

        if (!response.success || !response.payload) {
            throw new NotFoundException('Gym not found');
        }

        const gym = response.payload;


        if (gym.logo_url) {
            await this.storageService.deleteFile(gym.logo_url);
        }

        if (gym.images_urls && gym.images_urls.length > 0) {
            await Promise.all(
                gym.images_urls.map(url => this.storageService.deleteFile(url))
            );
        }

        const deleteResponse = await firstValueFrom(
            this.gymClient.send('delete_gym', { gymId, userId: req.user.userId })
        );

        if (!deleteResponse.success) {
            throw new InternalServerErrorException(deleteResponse.message);
        }

        return { success: true, message: 'Gym and all associated assets deleted successfully' };
    }



    @Get('getAll')
    @UseInterceptors(new ResponseTransformInterceptor(getGymDTO))
    async getGyms() {
        return await firstValueFrom(
            this.gymClient.send('get_all_gyms', {})
        );
    }

    @Get('getById/:id')
    @UseInterceptors(new ResponseTransformInterceptor(getGymDTO))
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
    @UseInterceptors(new ResponseTransformInterceptor(getGymDTO))
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
            return plainToInstance(getGymDTO, result.payload, {
                excludeExtraneousValues: true
            });;

        }

        throw new InternalServerErrorException(result.message);
    }






}