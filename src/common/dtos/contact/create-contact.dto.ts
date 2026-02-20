import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsOptional()
  phone: string;
  @IsEmail()
  @IsOptional()
  email: string;
}
