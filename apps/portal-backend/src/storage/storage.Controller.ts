import { Controller, Patch, Param, UseInterceptors, UploadedFiles, UseGuards, Logger, BadRequestException, Inject, HttpException, InternalServerErrorException, Delete, Req, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '@app/storage';
import { JwtAuthGuard } from '@app/auth';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
    private readonly logger = new Logger(StorageController.name);

    constructor(
        private readonly storageService: StorageService,
        @Inject('GYM_SERVICE') private readonly gymClient: ClientProxy,
    ) { }

    /**
     * STEP 2: Upload Media & Link to Gym
     * Endpoint: PATCH /storage/gym/:id/media
     */
    @Patch('gym/:id/media')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'logo', maxCount: 1 },
            { name: 'images', maxCount: 4 },
        ]),
    )
    async uploadGymMedia(
        @Param('id') gymId: string,
        // Removed ParseFilePipeBuilder, just getting the raw object
        @UploadedFiles() files: { logo?: Express.Multer.File[]; images?: Express.Multer.File[] },
    ) {
        this.logger.log(`Received upload request for Gym ID: ${gymId}`);

        // 1. SAFE FILE EXTRACTION
        const logoFiles = files?.logo || [];
        const galleryFiles = files?.images || [];
        const allFiles = [...logoFiles, ...galleryFiles];

        // 2. CHECK IF ANY FILES WERE SENT
        if (allFiles.length === 0) {
            throw new BadRequestException('No files provided for upload');
        }

        // 3. MANUAL VALIDATION (Same logic as your Register endpoint)
        for (const file of allFiles) {
            // Check Size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException(`File ${file.originalname} is too large (Max 5MB)`);
            }
            // Check Type
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                throw new BadRequestException(`File ${file.originalname} has an invalid type. Use JPG, PNG or WEBP.`);
            }
        }

        try {
            // 4. PARALLEL UPLOAD TO R2
            const [logoUrl, imageUrls] = await Promise.all([
                logoFiles.length > 0
                    ? this.storageService.uploadFile(logoFiles[0], 'logos')
                    : Promise.resolve(undefined),

                galleryFiles.length > 0
                    ? Promise.all(galleryFiles.map((f) => this.storageService.uploadFile(f, 'gym-pics')))
                    : Promise.resolve(undefined),
            ]);

            // 5. CONSTRUCT PAYLOAD
            const payload = {
                gymId: Number(gymId),
                logo_url: logoUrl,
                images_urls: imageUrls,
            };

            this.logger.log(`Updating Gym ${gymId} media via microservice`);

            // 6. CALL MICROSERVICE
            const result = await firstValueFrom(
                this.gymClient.send('update_gym_media', payload)
            );

            return {
                success: true,
                message: 'Media uploaded and linked successfully',
                data: result,
            };

        } catch (error) {
            this.logger.error(`Media Upload Error: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('An unexpected error occurred during media upload');
        }
    }

    @Delete('gym/:id/logo')
    async deleteGymLogo(
        @Param('id') gymId: string,
        @Req() req: any // To get userId for ownership check
    ) {
        this.logger.log(`Request to delete logo for Gym ID: ${gymId}`);


        // 1. Tell Microservice to remove the logo reference from DB
        // We expect the microservice to return the URL that was deleted
        const response = await firstValueFrom(
            this.gymClient.send('delete_gym_logo', {
                gymId: Number(gymId),
                userId: req.user.userId
            })
        );

        // 2. If DB update successful, delete the actual file from R2
        if (response.success && response.deletedUrl) {
            await this.storageService.deleteFile(response.deletedUrl);
        }

        return response;
    }

    /**
     * DELETE GALLERY IMAGE
     * Endpoint: DELETE /storage/gym/:id/gallery
     * Usage: Send the URL to delete in the Query String or Body
     * Example: DELETE /storage/gym/1/gallery?url=https://r2.../img.webp
     */
    @Delete('gym/:id/gallery')
    async deleteGymImage(
        @Param('id') gymId: string,
        @Query('url') imageUrl: string, // Get URL from query param
        @Req() req: any
    ) {
        if (!imageUrl) {
            throw new BadRequestException('Image URL is required');
        }

        this.logger.log(`Request to delete gallery image for Gym ID: ${gymId}`);


        // 1. Tell Microservice to remove this specific URL from the array
        const response = await firstValueFrom(
            this.gymClient.send('delete_gym_gallery_image', {
                gymId: Number(gymId),
                imageUrl,
                userId: req.user.userId
            })
        );

        // 2. If DB update successful, delete from R2
        if (response.success) {
            await this.storageService.deleteFile(imageUrl);
        }

        return response;
    }
}