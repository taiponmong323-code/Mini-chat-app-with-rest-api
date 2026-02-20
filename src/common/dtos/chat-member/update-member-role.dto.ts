import { $Enums } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  otherId: string;
  @IsEnum(['member', 'admin'])
  @IsNotEmpty()
  role: 'member' | 'admin';
}
