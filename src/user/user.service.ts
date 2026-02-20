import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class UserService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}
  async updateProfile(
    id: string,
    username?: string,
    file?: Express.Multer.File,
  ) {
    if (!username && !file)
      throw new BadRequestException(
        'update atleast one of username and profile',
      );

    let upload: UploadApiResponse;
    let update = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (file) {
      try {
        upload = await this.cloudinaryService.uploadFile(file);
      } catch (err) {
        throw new BadRequestException('upload failed!');
      }
      try {
        update = await this.prismaService.user.update({
          where: {
            id,
          },
          data: { profile: upload.secure_url },
        });
      } catch (err) {
        throw new BadRequestException('update profile failed');
      }
    }
    if (username) {
      try {
        update = await this.prismaService.user.update({
          where: {
            id,
          },
          data: {
            username,
          },
        });
      } catch (err) {
        throw new BadRequestException('update failed');
      }
    }

    return update;
  }

  async findOne(id: string) {
    return await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
  }
}
