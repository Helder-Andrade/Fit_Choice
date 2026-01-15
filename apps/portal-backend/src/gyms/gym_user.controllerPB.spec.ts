import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { GymUserControllerPB } from './gym_user.Controller';

/**
 * UNIT TEST: Gateway GymUserControllerPB
 * Focus: Request transformation and Microservice proxying.
 */
describe('GymUserControllerPB (Gateway)', () => {
  let controller: GymUserControllerPB;
  let client: ClientProxy;

  // Mocking the Microservice Client
  const mockGymClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymUserControllerPB],
      providers: [
        { provide: 'GYM_SERVICE', useValue: mockGymClient },
      ],
    }).compile();

    controller = module.get<GymUserControllerPB>(GymUserControllerPB);
    client = module.get<ClientProxy>('GYM_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addClient', () => {
    const mockDto = { userId: 10, role: 'client' };
    const mockRequest = { user: { userId: 1 } };

    it('SUCCESS: should transform gymId to number and send payload', async () => {
      mockGymClient.send.mockReturnValue(of({ success: true }));

      const result = await controller.addClient('123', mockDto as any, mockRequest);

      expect(mockGymClient.send).toHaveBeenCalledWith('register_user_in_gym', {
        gymId: 123,
        userId: 1,
        targetUser: mockDto,
      });
      expect(result.success).toBe(true);
    });

    it('FAILURE: should throw BadRequestException if DTO is missing', async () => {
      await expect(controller.addClient('123', null as any, mockRequest))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeRole', () => {
    it('SUCCESS: should format DELETE payload correctly', async () => {
      mockGymClient.send.mockReturnValue(of({ success: true }));

      const result = await controller.removeRole('1', '10', 'gym_staff', { user: { userId: 5 } });

      expect(mockGymClient.send).toHaveBeenCalledWith('remove_user_role_from_gym', {
        gymId: 1,
        userId: 10,
        role: 'gym_staff',
        requestingUserId: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getMembers', () => {
    it('SUCCESS: should forward gymId as number', async () => {
      const mockMembers = [{ userId: 10, role: 'client' }];
      mockGymClient.send.mockReturnValue(of(mockMembers));

      const result = await controller.getMembers('50', { user: { userId: 1 } });

      expect(mockGymClient.send).toHaveBeenCalledWith('get_gym_members', {
        gymId: 50,
        requestingUserId: 1,
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getMyMemberships', () => {
    it('SUCCESS: should pass logged in userId from JWT', async () => {
      mockGymClient.send.mockReturnValue(of([]));

      await controller.getMyMemberships({ user: { userId: 99 } });

      expect(mockGymClient.send).toHaveBeenCalledWith('get_user_memberships', 99);
    });

    it('FAILURE: should propagate errors from microservice', async () => {
      mockGymClient.send.mockReturnValue(throwError(() => new Error('Microservice Down')));

      await expect(controller.getMyMemberships({ user: { userId: 1 } }))
        .rejects.toThrow('Microservice Down');
    });
  });
});