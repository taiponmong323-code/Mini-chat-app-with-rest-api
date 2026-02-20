import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorator/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('media')
export class MediaController {
  constructor(private readonly prismaService: PrismaService) {}
  @Public()
  @Get('cleanDB')
  async cleanDB() {
    return await this.prismaService.cleanDB();
  }
}
