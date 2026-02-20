import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async sendMessage(
    id: string,
    chatId: string,
    text?: string,
    file?: Express.Multer.File,
  ) {
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
      throw new BadRequestException('user not in chat');
    if (!file && !text?.trim())
      throw new BadRequestException('media or text are required');

    if (file) {
      let upload: UploadApiResponse;
      try {
        upload = await this.cloudinaryService.uploadFile(file);
      } catch (err) {
        throw new BadRequestException('upload error');
      }
      try {
        return await this.prismaService.$transaction(async (prisma) => {
          const message = await prisma.message.create({
            data: {
              chatId,
              senderId: id,
              message: text?.trim(),
            },
            include: {
              user: true,
            },
          });
          await prisma.media.create({
            data: {
              messageId: message.id,
              url: upload.secure_url,
              senderId: id,
            },
          });
          return await prisma.message.findUnique({
            where: {
              id: message.id,
            },
            include: {
              media: true,
            },
          });
        });
      } catch (err) {
        throw new BadRequestException('can not create media');
      }
    } else if (text) {
      try {
        return await this.prismaService.message.create({
          data: {
            senderId: id,
            message: text?.trim(),
            chatId,
          },
          include: {
            user: true,
          },
        });
      } catch (err) {
        throw new BadRequestException('can not create text message');
      }
    } else throw new BadRequestException('send failed');
  }

  async editMessage(
    id: string,
    chatId: string,
    messageId: string,
    text: string,
  ) {
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
      throw new BadRequestException('user not in chat');
    let message = await this.prismaService.message.findUnique({
      where: {
        id: messageId,
      },
    });
    if (!message) throw new BadRequestException('message not found');
    try {
      message = await this.prismaService.message.update({
        where: {
          id: messageId,
        },
        data: {
          message: text,
        },
      });
    } catch (err) {
      throw new BadRequestException('can not delete message');
    }
    return message;
  }

  async deleteMessage(id: string, chatId: string, messageId: string) {
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
      throw new BadRequestException('user not in chat');
    let message = await this.prismaService.message.findUnique({
      where: {
        id: messageId,
      },
    });
    if (!message) throw new BadRequestException('message not found');
    try {
      message = await this.prismaService.message.delete({
        where: {
          id: messageId,
        },
      });
    } catch (err) {
      throw new BadRequestException('can not delete message');
    }
    return message;
  }

  async getAllMessage(id: string, chatId: string) {
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
      throw new BadRequestException('user not in chat');
    return await this.prismaService.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        created: 'asc',
      },
      include: {
        user: true,
        media: true,
      },
    });
  }
}
