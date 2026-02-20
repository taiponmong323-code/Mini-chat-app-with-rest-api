import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @IsOptional()
  username: string;
}
