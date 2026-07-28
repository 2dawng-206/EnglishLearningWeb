import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  // Bat buoc nhap dung mat khau hien tai truoc khi cho doi - tranh truong
  // hop ai do chiem duoc access token (vi du may dung chung) tu doi luon
  // mat khau nguoi dung.
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
