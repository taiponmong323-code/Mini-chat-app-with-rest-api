import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class deleteChatMemberDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @ArrayUnique()
  otherIds: string[];
}
