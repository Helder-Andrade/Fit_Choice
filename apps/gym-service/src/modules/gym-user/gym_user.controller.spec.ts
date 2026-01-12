import { Test, TestingModule } from '@nestjs/testing';
import { GymUserController } from './gym_user.controller';
import { GymUserService } from './gym_user.service';

describe('GymUserServiceController', () => {
  let gymUserServiceController: GymUserController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GymUserController],
      providers: [GymUserService],
    }).compile();

    gymUserServiceController = app.get<GymUserController>(GymUserController);
  });

  describe('root', () => {
    
  });
});
