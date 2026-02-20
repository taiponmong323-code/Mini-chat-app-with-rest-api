import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePrivateChatDto {
  @IsString()
  @IsNotEmpty()
  otherId: string;
}
