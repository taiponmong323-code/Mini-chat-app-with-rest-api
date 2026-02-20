import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Sub } from '../common/decorator/sub.decorator';
import { UpdateUsernameDto } from '../common/dtos/user/update-username.dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Patch()
  @UseInterceptors(FileInterceptor('file'))
  updateUser(
    @Sub() sub: string,
    @Body() dto: UpdateUsernameDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfile(sub, dto.username, file);
  }

  @Get()
  findOne(@Sub() sub: string) {
    return this.userService.findOne(sub);
  }
}
