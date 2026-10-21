import { Controller, Body, Post, Get, Patch, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('shift')
export class ShiftController {
    constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createShift(@Body() body: any, @Req() req: Request & { user: { userId: number } }) {
    return await this.shiftService.createShift({ ...body, user_id: req.user.userId });
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrentShift(@Req() req: Request & { user: { userId: number } }) {
  return this.shiftService.getCurrentShift(req.user.userId);
}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getShiftHistory(@Req() req: Request & { user: { userId: number } }) {
    return this.shiftService.getShiftHistory(req.user.userId);
  }

  @Get('sales-history')
  @UseGuards(JwtAuthGuard)
  getSalesHistory(
    @Req() req: Request & { user: { userId: number } },
    @Query('period') period = 'today',
    @Query('search') search = '',
  ) {
    if (period !== 'today' && period !== 'week' && period !== 'month' && period !== 'all') {
      throw new BadRequestException('Period must be today, week, month, or all');
    }
    return this.shiftService.getSalesHistory(req.user.userId, period, search);
  }

  @Get('closed-history')
  @UseGuards(JwtAuthGuard)
  getClosedShiftHistory(
    @Req() req: Request & { user: { userId: number } },
    @Query('period') period = 'today',
    @Query('search') search = '',
  ) {
    if (period !== 'today' && period !== 'week' && period !== 'month' && period !== 'all') {
      throw new BadRequestException('Period must be today, week, month, or all');
    }
    return this.shiftService.getClosedShiftHistory(req.user.userId, period, search);
  }

  @Patch('current/end')
  @UseGuards(JwtAuthGuard)
  endCurrentShift(
    @Body() body: { closing_cash: number },
    @Req() req: Request & { user: { userId: number } },
  ) {
    return this.shiftService.endCurrentShift(req.user.userId, Number(body.closing_cash));
  }
}
