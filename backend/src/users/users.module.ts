import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Parent } from './parent.entity';
import { School } from './school.entity';
// Tukar path ikut lokasi sebenar User entity kau.

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Parent, School]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
