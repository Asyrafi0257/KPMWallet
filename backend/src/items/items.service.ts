import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';

@Injectable()
export class ItemsService implements OnModuleInit {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async onModuleInit() {
    if (await this.itemRepository.count() > 0) return;

    await this.itemRepository.save([
      { name: 'Nasi Lemak', description: 'Meal', category: 'Food & Drink', price: 3.5, stock: 18 },
      { name: 'Mineral Water', description: '500 ml', category: 'Food & Drink', price: 1, stock: 24 },
      { name: 'Milo Ais', description: 'Drinks', category: 'Food & Drink', price: 2, stock: 12 },
      { name: 'Potato Chips', description: 'Original · 60 g', category: 'Snacks', price: 2, stock: 8 },
      { name: 'Chocolate Bar', description: 'Milk chocolate', category: 'Snacks', price: 1.5, stock: 15 },
      { name: 'A4 Exercise Book', description: '80 pages', category: 'Stationery', price: 2.5, stock: 20 },
      { name: 'Blue Ballpoint Pen', description: '0.5 mm', category: 'Stationery', price: 0.8, stock: 3 },
    ]);
  }

  async findAll() {
    return this.itemRepository.find({
      where: { is_active: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }
}
