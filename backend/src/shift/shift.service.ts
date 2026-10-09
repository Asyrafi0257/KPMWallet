import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './shift.entity';


@Injectable()
export class ShiftService {
    constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async createShift(data: {
    user_id: number;
    date: Date;
    start_shift: string;
    end_shift: string;
    starting_cash: number;
    shift_status: boolean;
  }) {
    const shift = this.shiftRepository.create({
      user: { user_id: data.user_id },
      date: data.date,
      start_shift: data.start_shift,
      end_shift: data.end_shift,
      starting_cash: data.starting_cash,
      shift_status: data.shift_status,
      
    });
  
  //bila kita try console then nampak shift_id jadi undefined kerana shift id blm di save lagi dalam database
  //console.log("Shift:", Shift);

   const savedShift = await this.shiftRepository.save(shift);

   //so dekat sini bila dh save maklumat shift then shift id akan automatik create shift id
  // console.log('Saved shift:', savedShift);
  // console.log('Generated ID:', savedShift.shift_id);
  return savedShift;
  }
}
