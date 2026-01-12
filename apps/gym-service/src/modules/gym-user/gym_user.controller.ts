import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, ForbiddenException, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { RegisterClientDTO } from '../../dtos/registerClientDTO';
import { GymUserService } from './gym_user.service';
import { GymRolesGuard } from '../../entities/auth/gym-roles.guard';

@Controller()
export class GymUserController {
  constructor(private readonly gymUserService: GymUserService) { }

  @MessagePattern('register_user_in_gym')
  @UseGuards(GymRolesGuard)
  async registerUser(@Payload() payload: any) {
    try {
      // 1. Destructure based on the Gateway payload keys
      const { gymId, targetUser } = payload;

      // 2. Safety check: If targetUser is undefined, the next line would crash
      if (!targetUser) {
        throw new RpcException({ message: 'Target user data is missing', status: 400 });
      }

      Logger.log(`Registering User ${targetUser.userId} to Gym ${gymId}`);

      const res = await this.gymUserService.associateUserToGym(
        gymId,
        targetUser.userId,
        targetUser.role
      );

      return { success: true, Payload: res };
    } catch (error) {
      // If it's an RpcException (like from the Guard), let it bubble up
      if (error instanceof RpcException) throw error;

      // Return the actual error message for debugging
      return { success: false, message: error.message };
    }
  }
}
