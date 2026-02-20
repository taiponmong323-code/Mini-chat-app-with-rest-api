import { BadRequestException, Injectable } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatMemberService {
  constructor(private readonly prismaService: PrismaService) {}
  async addChatMember(id: string, chatId: string, otherIds: string[]) {
    if (
      !(await this.prismaService.chat.findUnique({
        where: {
          id: chatId,
          type: 'group',
        },
      }))
    )
      throw new BadRequestException('group not found');
    const chatMember = await this.prismaService.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: id,
          chatId,
        },
      },
    });
    if (!chatMember) throw new BadRequestException('user not in chat');
    const others = await this.prismaService.user.findMany({
      where: {
        id: { in: otherIds },
      },
    });
    if (otherIds.length !== others.length)
      throw new BadRequestException('one or some user not exists');
    try {
      await this.prismaService.chatMember.createMany({
        data: otherIds.map((userId) => ({
          userId,
          chatId,
        })),
      });
      return 'add successful';
    } catch (err) {
      throw new BadRequestException('can not add member');
    }
  }

  async removeChatMember(id: string, chatId: string, otherIds: string[]) {
    if (
      !(await this.prismaService.chat.findUnique({
        where: {
          id: chatId,
          type: 'group',
        },
      }))
    )
      throw new BadRequestException('chat not found');
    const chatMember = await this.prismaService.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: id,
          chatId,
        },
      },
    });
    if (!chatMember) throw new BadRequestException('user not in chat');
    if (chatMember.role === 'member')
      throw new BadRequestException('permission not allow');
    const others = await this.prismaService.user.findMany({
      where: {
        id: { in: otherIds },
      },
    });
    if (otherIds.length !== others.length)
      throw new BadRequestException('one or some user not exists');
    try {
      await this.prismaService.chatMember.deleteMany({
        where: {
          userId: { in: otherIds },
          chatId,
        },
      });
      return 'remove successful';
    } catch (err) {
      throw new BadRequestException('can not remove users');
    }
  }

  async changeMemberRole(
    id: string,
    chatId: string,
    otherId: string,
    role: 'member' | 'admin',
  ) {
    if (
      !(await this.prismaService.chat.findUnique({
        where: {
          id: chatId,
          type: 'group',
        },
      }))
    )
      throw new BadRequestException('chat not found');
    const chatMember = await this.prismaService.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: id,
          chatId,
        },
      },
    });
    if (!chatMember) throw new BadRequestException('user not in chat');
    if (chatMember.role === 'member' || chatMember.role === 'admin')
      throw new BadRequestException('permission not allow');
    try {
      return await this.prismaService.chatMember.update({
        where: {
          userId_chatId: {
            userId: otherId,
            chatId,
          },
        },
        data: {
          role,
        },
      });
    } catch (err) {
      throw new BadRequestException('can not update role');
    }
  }
  async getChatMembers(id: string, chatId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
    });
    if (!chat) throw new BadRequestException('chat not found');
    if (
      !(await this.prismaService.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: id,
            chatId,
          },
        },
      }))
    )
      throw new BadRequestException('user not exists in chat');
    return await this.prismaService.chatMember.findMany({
      where: {
        chatId,
        userId: { not: id },
      },
      include: {
        user: true,
      },
    });
  }
}
