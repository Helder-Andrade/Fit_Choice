import { Test, TestingModule } from '@nestjs/testing';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';

describe('GymServiceController', () => {
  let gymServiceController: GymServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GymServiceController],
      providers: [GymServiceService],
    }).compile();

    gymServiceController = app.get<GymServiceController>(GymServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(gymServiceController.getHello()).toBe('Hello World!');
    });
  });
});
