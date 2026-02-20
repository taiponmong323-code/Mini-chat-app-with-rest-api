import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BadRequestException } from '@nestjs/common';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  contact: {
    findUnique: jest.fn(),
  },
  chat: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  chatMember: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const cloudMock = {
  uploadFile: jest.fn(),
};

describe('chat (unit)', () => {
  let service: ChatService;
  let prisma: PrismaService;
  let cloudinary: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrivateChat', () => {
    it('should throw if other not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(
        service.createPrivateChat('user-id', 'other-id'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPrivateChat('user-id', 'other-id'),
      ).rejects.toThrow('user not found');
      expect(prismaMock.user.findUnique).toHaveBeenCalled();
    });
    it('should throw if contact not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'other-id' });
      prismaMock.contact.findUnique.mockResolvedValue(null);
      await expect(
        service.createPrivateChat('user-id', 'other-id'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPrivateChat('user-id', 'other-id'),
      ).rejects.toThrow('contact not exists');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'other-id',
        },
      });
      expect(prismaMock.contact.findUnique).toHaveBeenCalledWith({
        where: {
          contactId_contactOfId: {
            contactId: 'user-id',
            contactOfId: 'other-id',
          },
        },
      });
    });
    it('should return existingChat', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'other-id' });
      prismaMock.contact.findUnique.mockResolvedValue({ id: 'contact-id' });
      prismaMock.chat.findFirst.mockResolvedValue({ id: 'chat-id' });
      await expect(
        service.createPrivateChat('user-id', 'other-id'),
      ).resolves.toEqual({
        id: 'chat-id',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'other-id',
        },
      });
      expect(prismaMock.contact.findUnique).toHaveBeenCalledWith({
        where: {
          contactId_contactOfId: {
            contactId: 'user-id',
            contactOfId: 'other-id',
          },
        },
      });
      expect(prismaMock.chat.findFirst).toHaveBeenCalledWith({
        where: {
          type: 'private',
          member: {
            every: {
              userId: { in: ['user-id', 'other-id'] },
            },
          },
        },
        include: {
          member: {
            include: { user: true },
          },
        },
      });
    });
    it('');
  });
});
