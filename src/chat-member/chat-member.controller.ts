import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Sub } from '../common/decorator/sub.decorator';
import { ChatMemberService } from './chat-member.service';
import { addChatMemberDto } from '../common/dtos/chat-member/add-chat-member.dto';
import { deleteChatMemberDto } from '../common/dtos/chat-member/delete-chat-member.dto';
import { UpdateMemberRoleDto } from '../common/dtos/chat-member/update-member-role.dto';

@Controller('chat-member')
export class ChatMemberController {
  constructor(private readonly chatMemberService: ChatMemberService) {}
  @Post(':chatId')
  addChatMember(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: addChatMemberDto,
  ) {
    return this.chatMemberService.addChatMember(sub, chatId, dto.otherIds);
  }

  @Delete(':chatId')
  deleteChatMember(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: deleteChatMemberDto,
  ) {
    return this.chatMemberService.removeChatMember(sub, chatId, dto.otherIds);
  }

  @Patch(':chatId')
  updateMemberRole(
    @Sub() sub: string,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.chatMemberService.changeMemberRole(
      sub,
      chatId,
      dto.otherId,
      dto.role,
    );
  }

  @Get(':chatId')
  getChatMember(@Sub() sub: string, @Param('chatId') chatId: string) {
    return this.chatMemberService.getChatMembers(sub, chatId);
  }
}
