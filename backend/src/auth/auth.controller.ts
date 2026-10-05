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
}