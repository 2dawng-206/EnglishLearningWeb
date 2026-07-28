import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  // Token thô lay tu link trong email (khong phai hash luu trong DB).
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
