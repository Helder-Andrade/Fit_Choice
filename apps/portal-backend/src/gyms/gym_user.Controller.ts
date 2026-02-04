import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Inject, Logger, Param, Post, Delete, Get, Req, UseGuards, Query } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { JwtAuthGuard } from "../../../../libs/auth/src/modules/jwt-auth.guard";
import { RegisterClientDTO } from "@app/shared/dtos/gyms/registerClientDTO";
import { firstValueFrom } from "rxjs";

@Controller('gym_user')
export class GymUserControllerPB {
    constructor(@Inject("GYM_SERVICE") private readonly gymUserClient: ClientProxy) { }

    @UseGuards(JwtAuthGuard)
    @Post('register_user/:id')
    @HttpCode(HttpStatus.CREATED)
    async addClient(@Param('id') gymId: string, @Body() dto: RegisterClientDTO, @Req() req) {
        if (!dto) throw new BadRequestException('Request body is missing');
        
        const payload = {
            gymId: Number(gymId),
            userId: req.user.userId, 
            targetUser: dto          
        };
        return await firstValueFrom(this.gymUserClient.send('register_user_in_gym', payload));
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':gymId/user/:userId/role/:role')
    async removeRole(
        @Param('gymId') gymId: string,
        @Param('userId') userId: string,
        @Param('role') role: string,
        @Req() req
    ) {
        const payload = {
            gymId: Number(gymId),
            userId: Number(userId),
            role: role,
            requestingUserId: req.user.userId 
        };
        return await firstValueFrom(this.gymUserClient.send('remove_user_role_from_gym', payload));
    }

    @UseGuards(JwtAuthGuard)
    @Get('gym_members/:gymId')
    async getMembers(@Param('gymId') gymId: string, @Req() req) {
        const payload = {
            gymId: Number(gymId),
            requestingUserId: req.user.userId
        };
        return await firstValueFrom(this.gymUserClient.send('get_gym_members', payload));
    }

    @UseGuards(JwtAuthGuard)
    @Get('my_memberships')
    async getMyMemberships(@Req() req) {
        return await firstValueFrom(this.gymUserClient.send('get_user_memberships', req.user.userId));
    }
}