import { Module } from '@nestjs/common';
import { ChatMemberController } from './chat-member.controller';
import { ChatMemberService } from './chat-member.service';

@Module({
  controllers: [ChatMemberController],
  providers: [ChatMemberService]
})
export class ChatMemberModule {}
