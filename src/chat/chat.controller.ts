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
import { Sub } from '../common/decorator/sub.decorator';
import { CreatePrivateChatDto } from '../common/dtos/chat/create-private-chat.dto';
import { ChatService } from './chat.service';
import { CreateGroupDto } from '../common/group/create-group.dto';
import { UpdateGroupDto } from '../common/group/update-group.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post('private')
  createPrivateChat(@Sub() id: string, @Body() dto: CreatePrivateChatDto) {
    return this.chatService.createPrivateChat(id, dto.otherId);
  }

  @Post('group')
  createGroupChat(@Sub() id: string, @Body() dto: CreateGroupDto) {
    return this.chatService.createGroupChat(id, dto.otherIds, dto.title);
  }

  @Patch('group/:chatId')
  @UseInterceptors(FileInterceptor('file'))
  updateGroup(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateGroupDto,
    @UploadedFile('file') file: Express.Multer.File,
  ) {
    return this.chatService.updateGroup(sub, chatId, dto.title, file);
  }

  @Get()
  getAllChat(@Sub() sub: string) {
    return this.chatService.getAllChat(sub);
  }

  @Delete(':chatId')
  deleteChat(@Sub() sub: string, @Param('chatId') chatId: string) {
    return this.chatService.deleteChat(sub, chatId);
  }
}
