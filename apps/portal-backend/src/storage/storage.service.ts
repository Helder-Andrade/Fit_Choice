import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

@Injectable()
export class StorageService {
    private s3Client: S3Client;

    constructor(private configService: ConfigService) {
        const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
        const accessKey = this.configService.get<string>('R2_ACCESS_KEY_ID');
        const secretKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKey!,
                secretAccessKey: secretKey!,
            },
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        // 1. Image Optimization Pipeline
        const optimizedBuffer = await sharp(file.buffer)
            .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({
                quality: 80,
                effort: 6
            })
            .toBuffer();

        // 2. Update filename to .webp
        const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const bucketName = this.configService.get<string>('R2_BUCKET_NAME')!;

        // 3. Upload to R2
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                Body: optimizedBuffer,
                ContentType: 'image/webp',
            }),
        );

        return `${this.configService.get<string>('R2_PUBLIC_URL')}/${fileName}`;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {


            const bucketUrl = this.configService.get<string>('R2_PUBLIC_URL')!;
            const key = fileUrl.replace(`${bucketUrl}/`, '');

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.configService.get<string>('R2_BUCKET_NAME'),
                    Key: key,
                }),
            );
            console.log(`Successfully deleted file from R2: ${key}`);
        } catch (error) {

            console.error(`Failed to delete file from R2: ${error.message}`);
        }
    }
}