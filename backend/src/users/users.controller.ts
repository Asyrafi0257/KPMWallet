
import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET USER PROFILE
  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(Number(id));
  }

  // UPDATE USER PROFILE
  @Put(':id')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateUserProfile(
      Number(id),
      dto,
    );
  }

  // CHANGE PASSWORD WITHOUT OLD PASSWORD
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.changePassword(
      Number(id),
      body.newPassword,
    );
  }
}
