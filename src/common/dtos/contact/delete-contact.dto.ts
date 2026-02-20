import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteContactDto {
  @IsString()
  @IsNotEmpty()
  otherId: string;
}
