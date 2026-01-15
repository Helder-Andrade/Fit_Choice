import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards, Request, Logger, BadRequestException, Get, Param, ParseIntPipe, NotFoundException, Query, InternalServerErrorException, Patch, Req, HttpException, UseInterceptors, UploadedFiles, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Delete } from "@nestjs/common";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "apps/auth-service/src/modules/auth/jwt-auth.guard";
import { RegisterGymDTO } from "apps/gym-service/src/dtos/registerGymDTO";
import { firstValueFrom } from "rxjs";
import { StorageService } from "../storage/storage.service";

@Controller('gym')
export class GymController {
    constructor(@Inject("GYM_SERVICE") private readonly gymClient: ClientProxy, private readonly storageService: StorageService) { }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'logo', maxCount: 1 },
        { name: 'images', maxCount: 4 },
    ]))
    async gymRegister(
        @Body() dto: RegisterGymDTO,
        @Req() req,
        @UploadedFiles() files: { logo?: Express.Multer.File[], images?: Express.Multer.File[] }
    ) {
        const allFiles = [...(files?.logo || []), ...(files?.images || [])];

        for (const file of allFiles) {
            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException(`File ${file.originalname} is too large`);
            }
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                throw new BadRequestException(`File ${file.originalname} has an invalid type`);
            }
        }
        const userId = parseInt(req.user.userId);

        // 1. Upload Logo if present
        let logoUrl = '';
        if (files?.logo?.[0]) {
            logoUrl = await this.storageService.uploadFile(files.logo[0], 'logos');
        }

        // 2. Upload Gallery Images in parallel
        let imageUrls: string[] = [];
        if (files?.images && files.images.length > 0) {
            imageUrls = await Promise.all(
                files.images.map(file => this.storageService.uploadFile(file, 'gym-pics'))
            );
        }

        // 3. Merge URLs into the DTO and send to Microservice
        const payload = {
            dto: {
                ...dto,
                logo_url: logoUrl,
                images_urls: imageUrls
            },
            userId
        };

        const response = await firstValueFrom(this.gymClient.send('register_gym', payload));

        if (!response.success)
            throw new BadRequestException(response.message);

        return response;
    }

    /*@UseGuards(JwtAuthGuard)
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async gymRegister(@Body() dto: RegisterGymDTO, @Req() req) {
        Logger.log('RegisterGymDTO:', dto);
        const userId = parseInt(req.user.userId);

        var response = await firstValueFrom(this.gymClient.send('register_gym', { dto, userId }));
        if (!response.success)
            throw new BadRequestException(response.message);

        return response;
    }*/

    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'logo', maxCount: 1 },
        { name: 'images', maxCount: 4 },
    ]))
    async updateGym(
        @Param('id') gymId: string,
        @Body() dto: RegisterGymDTO,
        @Req() req,
        @UploadedFiles() files: { logo?: Express.Multer.File[], images?: Express.Multer.File[] }
    ) {
        // 1. Get current gym data to see what files exist right now
        const currentData = await firstValueFrom(this.gymClient.send('get_gym_by_id', Number(gymId)));
        const oldGym = currentData.payload;

        // 2. LOGO CLEANUP: If a new logo is uploaded, delete the old one
        let logoUrl = dto.logo_url;
        if (files?.logo?.[0]) {
            if (oldGym.logo_url) {
                await this.storageService.deleteFile(oldGym.logo_url);
            }
            logoUrl = await this.storageService.uploadFile(files.logo[0], 'logos');
        }

        // 3. IMAGES CLEANUP: Find images that are in oldGym but NOT in the new dto.images_urls
        const imagesToDelete = oldGym.images_urls.filter(
            (url: string) => !dto.images_urls?.includes(url)
        );

        for (const url of imagesToDelete) {
            await this.storageService.deleteFile(url);
        }

        // 4. Handle new uploads
        let currentImages = Array.isArray(dto.images_urls) ? dto.images_urls : [];
        if (files?.images && files.images.length > 0) {
            const newUrls = await Promise.all(
                files.images.map(f => this.storageService.uploadFile(f, 'gym-pics'))
            );
            currentImages = [...currentImages, ...newUrls];
        }

        // 5. Send final payload
        const payload = {
            gymId: Number(gymId),
            userId: req.user.userId,
            dto: { ...dto, logo_url: logoUrl, images_urls: currentImages.slice(0, 4) }
        };

        return await firstValueFrom(this.gymClient.send('update_gym', payload));
    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    async deleteGym(@Param('id', ParseIntPipe) gymId: number, @Req() req) {
        // 1. Buscar os dados atuais para saber quais URLs apagar
        const response = await firstValueFrom(this.gymClient.send('get_gym_by_id', gymId));
        
        if (!response.success || !response.payload) {
            throw new NotFoundException('Gym not found');
        }

        const gym = response.payload;

        // 2. Limpeza de ficheiros no Cloudflare R2
        // Apagar o Logo
        if (gym.logo_url) {
            await this.storageService.deleteFile(gym.logo_url);
        }

        // Apagar todas as imagens da galeria em paralelo
        if (gym.images_urls && gym.images_urls.length > 0) {
            await Promise.all(
                gym.images_urls.map(url => this.storageService.deleteFile(url))
            );
        }

        // 3. Avisar o Microserviço para apagar o registo no DB
        const deleteResponse = await firstValueFrom(
            this.gymClient.send('delete_gym', { gymId, userId: req.user.userId })
        );

        if (!deleteResponse.success) {
            throw new InternalServerErrorException(deleteResponse.message);
        }

        return { success: true, message: 'Gym and all associated assets deleted successfully' };
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