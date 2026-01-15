import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, ForbiddenException, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { RegisterClientDTO } from '../../dtos/registerClientDTO';
import { GymUserService } from './gym_user.service';
import { GymStaffGuard } from '../../entities/auth/gym-roles.guard';

@Controller()
export class GymUserController {
  constructor(private readonly gymUserService: GymUserService) { }

  @MessagePattern('register_user_in_gym')
  @UseGuards(GymStaffGuard)
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


  /**
   * Remove a specific role from a user
   */
  @MessagePattern('remove_user_role_from_gym')
  @UseGuards(GymStaffGuard)
  async removeUserRole(@Payload() payload: any) {
    try {
      const { gymId, userId, role } = payload;
      const res = await this.gymUserService.removeSpecificRole(gymId, userId, role);
      return { success: true, payload: res };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException(error.message);
    }
  }

  /**
   * Get all members/staff belonging to a specific gym
   */
  @MessagePattern('get_gym_members')
  @UseGuards(GymStaffGuard)
  async getGymMembers(@Payload() gymId: number) {
    try {
      const members = await this.gymUserService.getGymMembers(gymId);
      return { success: true, payload: members };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  /**
   * Get all memberships for a specific user (User Profile view)
   */
  @MessagePattern('get_user_memberships')
  async getUserMemberships(@Payload() userId: number) {
    try {
      const memberships = await this.gymUserService.getUserMemberships(userId);
      return { success: true, payload: memberships };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  /**
   * Internal check for multiple roles 
   */
  @MessagePattern('get_user_roles_at_gym')
  async getUserRoles(@Payload() data: { gymId: number, userId: number }) {
    try {
      const roles = await this.gymUserService.getUserRolesAtGym(data.gymId, data.userId);
      return { success: true, payload: roles };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
