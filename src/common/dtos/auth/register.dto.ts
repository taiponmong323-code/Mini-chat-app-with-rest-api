import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsOptional()
  email?: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;
  @IsString()
  @IsNotEmpty()
  username: string;
}
