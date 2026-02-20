import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsOptional()
  email?: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;
}
