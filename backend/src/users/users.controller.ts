
import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: Request & { user: { userId: number } }) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMyProfile(
    @Body() dto: UpdateUserProfileDto,
    @Req() req: Request & { user: { userId: number } },
  ) {
    return this.usersService.updateUserProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/change-password')
  async changeMyPassword(
    @Body() body: { newPassword: string },
    @Req() req: Request & { user: { userId: number } },
  ) {
    return this.usersService.changePassword(req.user.userId, body.newPassword);
  }

  // GET USER PROFILE
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserProfile(@Param('id') id: string, @Req() req: Request & { user: { userId: number } }) {
    if (Number(id) !== req.user.userId) throw new ForbiddenException();
    return this.usersService.getUserProfile(Number(id));
  }

  // UPDATE USER PROFILE
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
    @Req() req: Request & { user: { userId: number } },
  ) {
    if (Number(id) !== req.user.userId) throw new ForbiddenException();
    return this.usersService.updateUserProfile(
      Number(id),
      dto,
    );
  }

  // CHANGE PASSWORD WITHOUT OLD PASSWORD
  @UseGuards(JwtAuthGuard)
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Req() req: Request & { user: { userId: number } },
  ) {
    if (Number(id) !== req.user.userId) throw new ForbiddenException();
    return this.usersService.changePassword(
      Number(id),
      body.newPassword,
    );
  }
}

