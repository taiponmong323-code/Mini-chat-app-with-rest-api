import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  DeleteApiResponse,
  UploadApiResponse,
} from 'cloudinary';
import { error } from 'console';
@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
  }
  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'chat-app' }, (error, result) => {
          if (error) reject(error);
          if (!result) reject(new Error('upload failed'));
          resolve(result as UploadApiResponse);
        })
        .end(file.buffer);
    });
  }
}
