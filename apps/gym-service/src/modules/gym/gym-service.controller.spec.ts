import { Test, TestingModule } from '@nestjs/testing';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';
import { GymUserService } from '../gym-user/gym_user.service';
import { of, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { UserRole } from '../../entities/user_gym.entity';
import { GymStaffGuard } from '../../entities/auth/gym-roles.guard';
import { GymOwnerGuard } from '../../entities/auth/gym-owner.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User_Gym } from '../../entities/user_gym.entity';

describe('GymServiceController', () => {
  let controller: GymServiceController;
  let gymService: GymServiceService;
  let gymUserService: GymUserService;

  const mockGymService = {
    createGym: jest.fn(),
    updateGym: jest.fn(),
    remove: jest.fn(),
    getGymById: jest.fn(),
    getGyms: jest.fn(),
    getGymsByLocation: jest.fn(),
  };

  const mockGymUserService = {
    associateUserToGym: jest.fn(),
  };

  const mockAuthClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymServiceController],
      providers: [
        { provide: GymServiceService, useValue: mockGymService },
        { provide: GymUserService, useValue: mockGymUserService },
        { provide: 'AUTH_SERVICE', useValue: mockAuthClient },
        // Providing mock repo for Guards that might be instantiated
        { provide: getRepositoryToken(User_Gym), useValue: {} },
      ],
    })
      .overrideGuard(GymStaffGuard).useValue({ canActivate: () => true })
      .overrideGuard(GymOwnerGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GymServiceController>(GymServiceController);
    gymService = module.get<GymServiceService>(GymServiceService);
    gymUserService = module.get<GymUserService>(GymUserService);
  });

  afterEach(() => jest.clearAllMocks());

  /**
   * TEST: registerGym
   * Validates the orchestration between Gym creation, User Validation (Auth Service),
   * and Role Association (GymUser Service).
   */
  describe('registerGym', () => {
    const payload = { 
      dto: { name: 'PowerHouse', address: 'Braga' } as any, 
      userId: 1 
    };

    it('SUCCESS: should create gym, validate user, and associate owner', async () => {
      mockGymService.createGym.mockResolvedValue({ id: 50 });
      mockAuthClient.send.mockReturnValue(of({ exists: true }));
      mockGymUserService.associateUserToGym.mockResolvedValue({});

      const result = await controller.registerGym(payload);

      expect(result.success).toBe(true);
      expect(result.payload!.id).toBe(50);
      expect(mockGymUserService.associateUserToGym).toHaveBeenCalledWith(50, 1, UserRole.GYM_OWNER);
    });

    it('FAILURE: should return error if user does not exist in Auth Service', async () => {
      mockGymService.createGym.mockResolvedValue({ id: 50 });
      mockAuthClient.send.mockReturnValue(of({ exists: false }));

      const result = await controller.registerGym(payload);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User does not exist');
    });
  });

  /**
   * TEST: updateGym
   */
  describe('updateGym', () => {
    it('SUCCESS: should return updated gym payload', async () => {
      const updateData = { dto: { name: 'New Name' } as any, gymId: 1 };
      mockGymService.updateGym.mockResolvedValue({ id: 1, name: 'New Name' });

      const result = await controller.updateGym(updateData);

      expect(result.success).toBe(true);
      expect(result.payload!.name).toBe('New Name');
    });

    it('FAILURE: should catch and return error message on service failure', async () => {
      mockGymService.updateGym.mockRejectedValue(new Error('Update failed'));
      const result = await controller.updateGym({ dto: {} as any, gymId: 1 });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Update failed');
    });
  });

  /**
   * TEST: search_gyms_by_location
   * Tests the geospatial search logic path.
   */
  describe('searchGyms', () => {
    it('SUCCESS: should return gyms within distance', async () => {
      const searchDto = { latitude: 41, longitude: -8, distanceKm: 10 };
      const mockGyms = [{ name: 'Gym 1' }, { name: 'Gym 2' }];
      mockGymService.getGymsByLocation.mockResolvedValue(mockGyms);

      const result = await controller.searchGyms(searchDto);

      expect(result.success).toBe(true);
      expect(result.payload).toHaveLength(2);
      expect(gymService.getGymsByLocation).toHaveBeenCalledWith(searchDto);
    });
  });

  /**
   * TEST: delete_gym
   */
  describe('deleteGym', () => {
    it('SUCCESS: should call remove and return success', async () => {
      mockGymService.remove.mockResolvedValue({ success: true });
      const result = await controller.deleteGym({ gymId: 1, userId: 1 });
      
      expect(result.success).not.toBe(false);
      expect(gymService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});