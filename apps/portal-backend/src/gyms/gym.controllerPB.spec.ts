import { Test, TestingModule } from '@nestjs/testing';
import { GymController } from './gym.Controller';
import { StorageService } from '../../../../libs/storage/src/storage.service';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * UNIT TEST: GymController (Gateway)
 * Focus: File handling logic, Storage cleanup, and Microservice routing.
 */
describe('GymController', () => {
    let controller: GymController;
    let storageService: StorageService;
    let gymClient: ClientProxy;

    const mockStorageService = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    const mockGymClient = {
        send: jest.fn(),
    };

    const mockFile = (name: string): Express.Multer.File => ({
        originalname: name,
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from(''),
    } as any);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GymController],
            providers: [
                { provide: StorageService, useValue: mockStorageService },
                { provide: 'GYM_SERVICE', useValue: mockGymClient },
            ],
        }).compile();

        controller = module.get<GymController>(GymController);
        storageService = module.get<StorageService>(StorageService);
        gymClient = module.get<ClientProxy>('GYM_SERVICE');
    });

    afterEach(() => jest.clearAllMocks());

    describe('gymRegister', () => {
        const dto = { name: 'Braga Power' };
        const req = { user: { userId: '1' } };

        it('SUCCESS: should upload logo/images and send to microservice', async () => {
            mockStorageService.uploadFile.mockResolvedValueOnce('logo_url').mockResolvedValueOnce('img1_url');
            mockGymClient.send.mockReturnValue(of({ success: true, payload: { id: 1 } }));

            const files = {
                logo: [mockFile('logo.png')],
                images: [mockFile('gym.png')],
            };

            const result = await controller.gymRegister(dto as any, req, files);

            expect(storageService.uploadFile).toHaveBeenCalledTimes(2);
            expect(mockGymClient.send).toHaveBeenCalledWith('register_gym', expect.objectContaining({
                dto: expect.objectContaining({ logo_url: 'logo_url', images_urls: ['img1_url'] })
            }));
            expect(result.success).toBe(true);
        });

        it('FAILURE: should throw error if file is too large', async () => {
            const files = {
                logo: [{ ...mockFile('big.png'), size: 10 * 1024 * 1024 }],
            };

            await expect(controller.gymRegister(dto as any, req, files as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('updateGym', () => {
        const gymId = '1';
        const dto = { name: 'Updated Gym', images_urls: ['keep_this.jpg'] };
        const oldGym = { logo_url: 'old_logo.jpg', images_urls: ['keep_this.jpg', 'delete_this.jpg'] };

        it('SUCCESS: should delete removed images and upload new ones', async () => {
            // Mock get current gym
            mockGymClient.send.mockReturnValueOnce(of({ success: true, payload: oldGym }));
            // Mock successful update
            mockGymClient.send.mockReturnValueOnce(of({ success: true }));
            mockStorageService.uploadFile.mockResolvedValue('new_logo_url');

            const files = { logo: [mockFile('new_logo.png')] };

            await controller.updateGym(gymId, dto as any, { user: { userId: 1 } }, files as any);

            // Verify old logo was deleted because new one was uploaded
            expect(storageService.deleteFile).toHaveBeenCalledWith('old_logo.jpg');
            // Verify 'delete_this.jpg' was deleted because it's not in the new DTO
            expect(storageService.deleteFile).toHaveBeenCalledWith('delete_this.jpg');
            expect(storageService.uploadFile).toHaveBeenCalled();
        });
    });

    describe('deleteGym', () => {
        it('SUCCESS: should clean up storage and call microservice delete', async () => {
            const gymData = { logo_url: 'logo.jpg', images_urls: ['img1.jpg'] };
            mockGymClient.send.mockReturnValueOnce(of({ success: true, payload: gymData }));
            mockGymClient.send.mockReturnValueOnce(of({ success: true }));

            const result = await controller.deleteGym(1, { user: { userId: 1 } });

            expect(storageService.deleteFile).toHaveBeenCalledTimes(2); // Logo + 1 Image
            expect(mockGymClient.send).toHaveBeenCalledWith('delete_gym', { gymId: 1, userId: 1 });
            expect(result.success).toBe(true);
        });

        it('FAILURE: should throw NotFound if gym does not exist', async () => {
            mockGymClient.send.mockReturnValue(of({ success: false }));

            await expect(controller.deleteGym(999, { user: { userId: 1 } }))
                .rejects.toThrow(NotFoundException);
        });
    });
});