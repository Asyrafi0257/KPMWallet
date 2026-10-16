
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';

export class UpdateUserProfileDto {
  email?: string;
  username?: string;
  nric?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // GET USER PROFILE
  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        role: true,
        nric: true,
        created_at: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // UPDATE USER PROFILE
  async updateUserProfile(
    userId: number,
    dto: UpdateUserProfileDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check duplicate email
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: {
          email: dto.email,
          user_id: Not(userId),
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email is already in use');
      }

      user.email = dto.email;
    }

    // Check duplicate NRIC
    if (dto.nric && dto.nric !== user.nric) {
      const existingNric = await this.userRepository.findOne({
        where: {
          nric: dto.nric,
          user_id: Not(userId),
        },
      });

      if (existingNric) {
        throw new ConflictException('NRIC is already in use');
      }

      user.nric = dto.nric;
    }

    // Update username
    if (dto.username !== undefined) {
      user.username = dto.username;
    }

    await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user: await this.getUserProfile(userId),
    };
  }

  // CHANGE PASSWORD WITHOUT OLD PASSWORD
  async changePassword(
    userId: number,
    newPassword: string,
  ) {
    if (
      typeof newPassword !== 'string' ||
      newPassword.trim().length === 0
    ) {
      throw new BadRequestException(
        'New password is required',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the new password before saving
    user.password = await bcrypt.hash(newPassword, 10);

    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully',
    };
  }
}
