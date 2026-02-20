import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async createPrivateChat(id: string, otherId: string) {
    const other = await this.prismaService.user.findUnique({
      where: {
        id: otherId,
      },
    });
    if (!other) throw new BadRequestException('user not found');
    const contact = await this.prismaService.contact.findUnique({
      where: {
        contactId_contactOfId: {
          contactId: id,
          contactOfId: otherId,
        },
      },
    });
    if (!contact) throw new BadRequestException('contact not exists');
    const existingChat = await this.prismaService.chat.findFirst({
      where: {
        type: 'private',
        member: {
          every: {
            userId: { in: [id, otherId] },
          },
        },
      },
      include: {
        member: {
          include: { user: true },
        },
      },
    });

    if (existingChat) return existingChat;

    try {
      const createChat = await this.prismaService.chat.create({
        data: {
          member: {
            create: [{ userId: id }, { userId: otherId }],
          },
        },
      });
      const chat = await this.prismaService.chat.findUnique({
        where: {
          id: createChat.id,
        },
        include: {
          member: {
            where: {
              userId: { not: id },
            },
            include: {
              user: true,
            },
          },
        },
      });
      if (!chat) throw new BadRequestException('can not get chat');
      return chat;
    } catch (err) {
      throw new BadRequestException('can not create chat');
    }
  }
  async createGroupChat(id: string, otherIds: string[], title: string) {
    if (otherIds.length !== new Set(otherIds).size)
      throw new BadRequestException('can not duplicate user');
    if (otherIds.includes(id))
      throw new BadRequestException('can not add yourself');
    const others = await this.prismaService.user.findMany({
      where: {
        id: { in: otherIds },
      },
    });
    if (otherIds.length !== others.length)
      throw new BadRequestException('one of user not exists');
    try {
      return await this.prismaService.chat.create({
        data: {
          type: 'group',
          title,
          profile:
            'https://res.cloudinary.com/dryz9qrvx/image/upload/v1768811533/group_profile_wljea3.png',
          member: {
            create: [
              { userId: id, role: 'owner' },
              ...otherIds.map((userId) => ({
                userId,
              })),
            ],
          },
        },
      });
    } catch (err) {
      throw new BadRequestException('can not create group');
    }
  }

  async updateGroup(
    id: string,
    chatId: string,
    title?: string,
    file?: Express.Multer.File,
  ) {
    if (!title && !file)
      throw new BadRequestException('title or file are required');
    let chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
        type: 'group',
      },
    });
    if (!chat) throw new BadRequestException('chat not found');
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
      throw new BadRequestException('permission not allow to update');
    if (title) {
      chat = await this.prismaService.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          title,
        },
      });
    }
    if (file) {
      let upload: UploadApiResponse;

      try {
        upload = await this.cloudinaryService.uploadFile(file);
      } catch (err) {
        throw new BadRequestException('upload error');
      }
      try {
        chat = await this.prismaService.chat.update({
          where: {
            id: chatId,
          },
          data: {
            profile: upload.secure_url,
          },
        });
      } catch (err) {
        throw new BadRequestException('can not create profile');
      }
    }
    return chat;
  }

  async getAllChat(id: string) {
    const chatMember = await this.prismaService.chatMember.findMany({
      where: {
        userId: id,
      },
      include: {
        chat: true,
      },
    });
    return await this.prismaService.chat.findMany({
      where: {
        id: { in: chatMember.map((cm) => cm.chat.id) },
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async deleteChat(id: string, chatId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
    });
    if (!chat) throw new BadRequestException('chat not exists');
    const chatMember = await this.prismaService.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: id,
          chatId,
        },
      },
    });
    if (!chatMember) throw new BadRequestException('chat member not exists');
    if (chat.type === 'group') {
      if (chatMember.role === 'member')
        throw new BadRequestException('permission not allow to delete group');
      try {
        await this.prismaService.chat.delete({
          where: {
            id: chatId,
          },
        });
      } catch (err) {
        throw new BadRequestException('delete error');
      }
    }
    if (chat.type === 'private') {
      try {
        await this.prismaService.chat.delete({
          where: {
            id: chatId,
          },
        });
      } catch (err) {
        throw new BadRequestException('delete error');
      }
    }
    return 'delete successful';
  }
}
