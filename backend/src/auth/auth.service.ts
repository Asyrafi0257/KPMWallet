import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private emailService: EmailService,
  ) {}

  async checkNric(nric: string) {
    const user = await this.userRepository.findOne({
      where: { nric },
    });

    return {
      exists: !!user,
    };
  }

  async sendRegistrationCode(email: string) {
    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.emailService.sendRegistrationCode(
      email,
      code,
    );

    return {
      message: 'Registration code sent successfully',
    };
  }
  async createPassword(
    nric: string,
    email: string,
    role: string,
    password: string,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { nric },
    });

    if (existingUser) {
      return {
        message: 'NRIC is already registered',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      nric,
      email,
      role,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    return {
      message: 'Account created successfully',
    };
  }
}