import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  test() {
    return {
      message: 'Auth API is working!',
    };
  }
}