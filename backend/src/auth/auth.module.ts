import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { EmailModule } from '../email/email.module';
import { OtpVerification } from '../auth/otp-verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpVerification]), EmailModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
