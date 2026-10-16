import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';


//semua api dalam controller ni bermula dengan /auth
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('check-login')
  checkLogin(
    @Body('nric') nric: string, 
    @Body('role') role: string) {
    return this.authService.checkLogin(nric, role);
  }

  @Post('send-code')
  sendCode(@Body('email') email: string) {
  return this.authService.sendRegistrationCode(email);
}

@Post('create-password')
  createPassword(
    @Body('nric') nric: string,
    @Body('email') email: string,
    @Body('role') role: string,
    @Body('password') password: string,
  ) {
    return this.authService.createPassword(
      nric,
      email,
      role,
      password,
    );
  }

@Post('login')
  login(
    @Body('nric') nric: string,
    @Body('role') role: string,
    @Body('password') password: string,
) {
  return this.authService.login(nric, role, password);
}

@Post('forgot-password')
  forgotPassword(
    @Body('nric')
    nric:string,
    @Body('role')
    role:string,
    @Body("email")
    email:string
  ){
    return this.authService.forgotPassword(nric, role, email);
  }

  @Post('verify-reset-otp')
async verifyResetOtp(
  @Body()
  body: {
    nric: string;
    role: string;
    email: string;
    otp: string;
  },
) {
  return this.authService.verifyResetOtp(
    body.nric,
    body.role,
    body.email,
    body.otp,
  );
}

@Post('reset-password')
async resetPassword(
  @Body()
  body: {
    nric: string;
    role: string;
    email: string;
    otp: string;
    newPassword: string;
  },
) {
  return this.authService.resetPassword(
    body.nric,
    body.role,
    body.email,
    body.otp,
    body.newPassword,
  );
}
}