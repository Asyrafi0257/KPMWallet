
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
import { Parent } from './parent.entity';
import { School } from './school.entity';

export class UpdateUserProfileDto {
  email?: string;
  username?: string;
  nric?: string;
  address?: string;
  date_of_birth?: string | null;
  gender?: string;
  nationality?: string;
  class_name?: string;
  mother_full_name?: string;
  mother_identification_number?: string;
  mother_phone_number?: string;
  mother_email?: string;
  mother_occupation?: string;
  father_full_name?: string;
  father_identification_number?: string;
  father_phone_number?: string;
  father_email?: string;
  father_occupation?: string;
  guardian_full_name?: string;
  guardian_relationship?: string;
  guardian_phone_number?: string;
  guardian_email?: string;
  school_name?: string;
  school_address?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
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
        address: true,
        date_of_birth: true,
        gender: true,
        nationality: true,
        class_name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [parent, school] = await Promise.all([
      this.parentRepository.findOne({ where: { user: { user_id: userId } } }),
      this.schoolRepository.findOne({ where: { user: { user_id: userId } } }),
    ]);

    const { parent_id: _parentId, user: _parentUser, ...parentDetails } = parent ?? {};
    const { school_id: _schoolId, user: _schoolUser, ...schoolDetails } = school ?? {};

    return { ...user, ...parentDetails, ...schoolDetails };
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

    if (dto.address !== undefined) user.address = dto.address;
    if (dto.date_of_birth !== undefined) user.date_of_birth = dto.date_of_birth;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.nationality !== undefined) user.nationality = dto.nationality;
    if (dto.class_name !== undefined) user.class_name = dto.class_name;

    const parentFields: (keyof UpdateUserProfileDto)[] = [
      'mother_full_name', 'mother_identification_number', 'mother_phone_number', 'mother_email', 'mother_occupation',
      'father_full_name', 'father_identification_number', 'father_phone_number', 'father_email', 'father_occupation',
      'guardian_full_name', 'guardian_relationship', 'guardian_phone_number', 'guardian_email',
    ];
    if (parentFields.some((field) => dto[field] !== undefined)) {
      let parent = await this.parentRepository.findOne({ where: { user: { user_id: userId } } });
      if (!parent) parent = this.parentRepository.create({ user });
      for (const field of parentFields) {
        if (dto[field] !== undefined) (parent as any)[field] = dto[field];
      }
      await this.parentRepository.save(parent);
    }

    if (dto.school_name !== undefined || dto.school_address !== undefined) {
      let school = await this.schoolRepository.findOne({ where: { user: { user_id: userId } } });
      if (!school) school = this.schoolRepository.create({ user });
      if (dto.school_name !== undefined) school.school_name = dto.school_name;
      if (dto.school_address !== undefined) school.school_address = dto.school_address;
      await this.schoolRepository.save(school);
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
