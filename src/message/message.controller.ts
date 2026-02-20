import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Sub } from '../common/decorator/sub.decorator';
import { CreateMessageDto } from '../common/dtos/message/create-message.dto';
import { MessageService } from './message.service';
import { UpdateMessageDto } from '../common/dtos/message/update-message.dto';
import { DeleteMessageDto } from '../common/dtos/message/delete-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post(':chatId')
  @UseInterceptors(FileInterceptor('file'))
  createMessage(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto?: CreateMessageDto,
    @UploadedFile('file') file?: Express.Multer.File,
  ) {
    return this.messageService.sendMessage(sub, chatId, dto?.text, file);
  }

  @Patch(':chatId')
  editMessage(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messageService.editMessage(
      sub,
      chatId,
      dto.messageId,
      dto.text,
    );
  }

  @Delete(':chatId')
  deleteMessage(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: DeleteMessageDto,
  ) {
    return this.messageService.deleteMessage(sub, chatId, dto.messageId);
  }
  @Get(':chatId')
  getAllMessage(@Sub() sub: string, @Param('chatId') chatId: string) {
    return this.messageService.getAllMessage(sub, chatId);
  }
}
