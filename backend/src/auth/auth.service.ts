import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { OtpVerification } from "../auth/otp-verification.entity";
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(OtpVerification)
    private otpRepository: Repository<OtpVerification>,

    private emailService: EmailService,
  ) {}

  async checkLogin(nric: string, role: string) {
    const user = await this.userRepository.findOne({
      where: { 
        nric,
        role
       },
    });

    if (!user) {
    return {
      success: false,
      message: 'NRIC and Role not found',
    };
  }

  if (user.role !== role) {
    return {
      success: false,
      message: 'Role does not match',
    };
  }

  return {
    success: true,
    role: user.role,
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
  async login(nric: string, role: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { nric, role },
    });

    if (!user) {
      return { success: false, message: 'NRIC or role not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { success: false, message: 'Incorrect password' };
    }

    return { success: true, role: user.role };
  }

  

async forgotPassword(
  nric: string,
  role: string,
  email: string,
) {
  // 1. Semak akaun user
  const user = await this.userRepository.findOne({
    where: { nric, role, email },
  });

  if (!user) {
    return {
      success: false,
      message: 'NRIC, role, or email does not match',
    };
  }

  // 2. Batalkan semua OTP reset password lama yang belum digunakan
  const oldOtpRecords = await this.otpRepository.find({
    where: {
      user: { user_id: user.user_id },
      purpose: 'RESET_PASSWORD',
      used: false,
    },
  });

  for (const record of oldOtpRecords) {
    record.used = true;
  }

  if (oldOtpRecords.length > 0) {
    await this.otpRepository.save(oldOtpRecords);
  }

  // 3. Generate OTP baharu, 6 digit
  const otp = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  // 4. Hash OTP sebelum simpan ke database
  const otpHash = await bcrypt.hash(otp, 10);

  const otpRecord = this.otpRepository.create({
    user,
    otp_hash: otpHash,
    purpose: 'RESET_PASSWORD',
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    verified: false,
    used: false,
  });

  await this.otpRepository.save(otpRecord);

  // 5. Hantar OTP baharu ke email
  await this.emailService.sendPasswordResetOtp(
    email,
    otp,
  );

  // 6. Return response kepada frontend
  return {
    success: true,
    message: 'OTP sent successfully',
  };
}



async verifyResetOtp(
  nric: string,
  role: string,
  email: string,
  otp: string,
) {
  // 1. Cari user berdasarkan maklumat akaun
  const user = await this.userRepository.findOne({
    where: {
      nric,
      role,
      email,
    },
  });

  if (!user) {
    throw new BadRequestException(
      'Invalid account details',
    );
  }

  // 2. Cari OTP yang belum digunakan
  const otpRecord = await this.otpRepository.findOne({
    where: {
      user: { user_id: user.user_id },
      purpose: 'RESET_PASSWORD',
      verified: false,
      used: false,
    },
    order: {
      expires_at: 'DESC',
    },
  });

  if (!otpRecord) {
    throw new BadRequestException(
      'OTP not found or already used',
    );
  }

  // 3. Semak sama ada OTP sudah expired
  if (otpRecord.expires_at.getTime() <= Date.now()) {
    throw new BadRequestException(
      'OTP has expired. Please request a new OTP.',
    );
  }

  // 4. Bandingkan OTP dengan hash dalam database
  const isOtpValid = await bcrypt.compare(
    otp,
    otpRecord.otp_hash,
  );

  if (!isOtpValid) {
    throw new BadRequestException(
      'Incorrect OTP',
    );
  }

  // 5. Tandakan OTP sebagai verified
  otpRecord.verified = true;

  await this.otpRepository.save(otpRecord);

  // 6. Beritahu frontend bahawa OTP berjaya disahkan
  return {
    success: true,
    message: 'OTP verified successfully',
  };
}


async resetPassword(
  nric: string,
  role: string,
  email: string,
  otp: string,
  newPassword: string,
) {
  // 1. Cari akaun user
  const user = await this.userRepository.findOne({
    where: {
      nric,
      role,
      email,
    },
  });

  if (!user) {
    throw new BadRequestException(
      'Invalid account details',
    );
  }

  // 2. Cari OTP yang sudah verified tetapi belum digunakan
  const otpRecord = await this.otpRepository.findOne({
    where: {
      user: { user_id: user.user_id },
      purpose: 'RESET_PASSWORD',
      verified: true,
      used: false,
    },
    order: {
      expires_at: 'DESC',
    },
  });

  if (!otpRecord) {
    throw new BadRequestException(
      'Please verify your OTP first',
    );
  }

  // 3. Semak tempoh sah OTP
  if (otpRecord.expires_at.getTime() <= Date.now()) {
    throw new BadRequestException(
      'Verification expired. Please request a new OTP.',
    );
  }

  // 4. Pastikan OTP yang dihantar sepadan
  const isOtpValid = await bcrypt.compare(
    otp,
    otpRecord.otp_hash,
  );

  if (!isOtpValid) {
    throw new BadRequestException(
      'Invalid verification code',
    );
  }

  // 5. Hash password baharu
  const hashedPassword = await bcrypt.hash(
    newPassword,
    10,
  );

  user.password = hashedPassword;

  await this.userRepository.save(user);

  // 6. Tandakan OTP sebagai sudah digunakan
  otpRecord.used = true;

  await this.otpRepository.save(otpRecord);

  return {
    success: true,
    message: 'Password reset successfully',
  };
}



}