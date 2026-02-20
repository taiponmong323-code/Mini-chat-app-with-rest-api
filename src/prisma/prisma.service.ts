import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaPg({
      connectionString,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect().then(() => console.log('connected'));
  }

  async onModuleDestroy() {
    await this.$disconnect().then(() => console.log('disconnected'));
  }

  async cleanDB() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      const modelNames = Object.keys(this).filter(
        (key) => this[key] && typeof this[key].deleteMany === 'function',
      );
      console.log(modelNames);
      console.log(process.env.DATABASE_URL);
      for (const model of modelNames) {
        await this[model].deleteMany();
      }
    }
  }
}
