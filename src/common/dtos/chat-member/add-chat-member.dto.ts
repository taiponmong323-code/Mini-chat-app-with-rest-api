import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class addChatMemberDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  otherIds: string[];
}
