import { Test, TestingModule } from '@nestjs/testing';
import { GymUserController } from './gym_user.controller';
import { GymUserService } from './gym_user.service';
import { RpcException } from '@nestjs/microservices';
import { User_Gym, UserRole } from '../../entities/user_gym.entity';
import { GymStaffGuard } from '../../entities/auth/gym-roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * UNIT TEST SUITE: GymUserController
 * * Purpose: To verify that the controller correctly handles incoming Microservice signals,
 * validates basic payload structures, and maps service responses/errors to the expected
 * Rpc format for the API Gateway.
 */
describe('GymUserController', () => {
  let controller: GymUserController;
  let service: GymUserService;

  /**
   * Mock Service: We use a jest.fn() mock to isolate the controller.
   * This prevents real database calls or Auth service communication during tests.
   */
  const mockGymUserService = {
    associateUserToGym: jest.fn(),
    removeSpecificRole: jest.fn(),
    getGymMembers: jest.fn(),
    getUserMemberships: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymUserController],
      providers: [
        {
          provide: GymUserService,
          useValue: mockGymUserService,
        },
        // 1. Add this mock to satisfy the Guard's dependency
        {
          provide: getRepositoryToken(User_Gym),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    })
      // 2. Override the guard so it doesn't run its logic during Controller tests
      .overrideGuard(GymStaffGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GymUserController>(GymUserController);
    service = module.get<GymUserService>(GymUserService);
  });

  afterEach(() => {
    // Ensures that call counts (e.g., toHaveBeenCalled) are reset between tests
    jest.clearAllMocks();
  });

  /**
   * TEST CASE: registerUser
   * Scenarios: Successful association, Missing payload validation, Error propagation.
   */
  describe('registerUser', () => {
    const validPayload = {
      gymId: 1,
      targetUser: { userId: 10, role: UserRole.CLIENT },
    };

    it('SUCCESS: should register a user and return success object', async () => {
      mockGymUserService.associateUserToGym.mockResolvedValue({ id: 99 });

      const result = await controller.registerUser(validPayload);

      expect(result).toEqual({ success: true, Payload: { id: 99 } });
      expect(service.associateUserToGym).toHaveBeenCalledWith(1, 10, UserRole.CLIENT);
    });

    it('FAILURE: should throw RpcException if targetUser is missing', async () => {
      await expect(controller.registerUser({ gymId: 1 } as any))
        .rejects
        .toThrow(RpcException);
    });

    it('FAILURE: should bubble up RpcException if service fails', async () => {
      mockGymUserService.associateUserToGym.mockRejectedValue(
        new RpcException({ message: 'DB Error', status: 500 }),
      );

      await expect(controller.registerUser(validPayload)).rejects.toThrow(RpcException);
    });
  });

  /**
   * TEST CASE: removeUserRole
   * Scenarios: Successful deletion, Conversion of generic Errors into RpcExceptions.
   */
  describe('removeUserRole', () => {
    it('SUCCESS: should remove a role', async () => {
      mockGymUserService.removeSpecificRole.mockResolvedValue({ success: true });

      const payload = { gymId: 1, userId: 10, role: UserRole.GYM_STAFF };
      const result = await controller.removeUserRole(payload);

      expect(result.success).toBe(true);
      expect(service.removeSpecificRole).toHaveBeenCalled();
    });

    it('FAILURE: should throw RpcException if role not found or db error occurs', async () => {
      mockGymUserService.removeSpecificRole.mockRejectedValue(new Error('Not Found'));

      const payload = { gymId: 1, userId: 10, role: UserRole.GYM_STAFF };
      await expect(controller.removeUserRole(payload)).rejects.toThrow(RpcException);
    });
  });

  /**
   * TEST CASE: getGymMembers
   * Scenarios: Data retrieval, Empty set handling.
   */
  describe('getGymMembers', () => {
    it('SUCCESS: should return list of members', async () => {
      const mockMembers = [{ userId: 1, role: UserRole.GYM_OWNER }];
      mockGymUserService.getGymMembers.mockResolvedValue(mockMembers);

      const result = await controller.getGymMembers(1);

      expect(result.success).toBe(true);
      expect(result.payload).toEqual(mockMembers);
    });

    it('SUCCESS: should return empty array if no members found', async () => {
      mockGymUserService.getGymMembers.mockResolvedValue([]);
      const result = await controller.getGymMembers(1);

      // Verification that it returns an empty array rather than an error
      expect(result.payload).toEqual([]);
    });
  });
});