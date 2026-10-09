import { Controller, Body, Post } from '@nestjs/common';
import { ShiftService } from './shift.service';

@Controller('shift')
export class ShiftController {
    constructor(private readonly shiftService: ShiftService) {}

  @Post()
  async createShift(@Body() body: any) {
    return await this.shiftService.createShift(body);
  }
}
