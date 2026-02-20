import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prismaService: PrismaService) {}
  async createContact(id: string, phone?: string, email?: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) throw new UnauthorizedException('access denied');
    if (!email && !phone) throw new BadRequestException('need email or phone');

    if (user.phone === phone || user.email === email)
      throw new BadRequestException('can not add yourself to contact');
    const other = await this.prismaService.user.findUnique({
      where: {
        phone: phone,
        email: email,
      },
    });
    if (!other) throw new BadRequestException('user not found');
    let contact = await this.prismaService.contact.findUnique({
      where: {
        contactId_contactOfId: {
          contactId: id,
          contactOfId: other.id,
        },
      },
    });
    if (contact) throw new BadRequestException('contact exits');
    try {
      contact = await this.prismaService.contact.create({
        data: {
          contactId: id,
          contactOfId: other.id,
        },
        include: {
          contactOf: true,
        },
      });
      await this.prismaService.contact.create({
        data: {
          contactId: other.id,
          contactOfId: id,
        },
        include: {
          contactOf: true,
        },
      });
    } catch (err) {
      throw new BadRequestException('can not create contact');
    }
    return contact;
  }

  async removeContact(id: string, otherId: string) {
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
    const otherContact = await this.prismaService.contact.findUnique({
      where: {
        contactId_contactOfId: {
          contactId: otherId,
          contactOfId: id,
        },
      },
    });
    if (!contact || !otherContact)
      throw new BadRequestException('contact not exists');
    try {
      await this.prismaService.contact.delete({
        where: {
          id: contact.id,
        },
      });
      await this.prismaService.contact.delete({
        where: {
          id: otherContact.id,
        },
      });
      return 'remove contact successfull';
    } catch (err) {
      throw new BadRequestException('can not remove contact');
    }
  }

  async getContacts(id: string) {
    try {
      return await this.prismaService.contact.findMany({
        where: {
          contactId: id,
        },
        include: {
          contactOf: true,
        },
      });
    } catch (err) {
      throw new BadRequestException('error get contacts');
    }
  }
}
