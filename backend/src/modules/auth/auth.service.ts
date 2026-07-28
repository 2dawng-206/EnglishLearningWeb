import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { UserRole } from '../users/entities/user.entity';

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 phut

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: passwordHash,
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<AuthTokensDto> {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user?.refreshToken) throw new ForbiddenException('Access denied');

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) throw new ForbiddenException('Access denied');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /** Issues a fresh access+refresh pair and persists the new refresh hash (rotation). */
  private async issueTokens(userId: number, email: string, role: UserRole): Promise<AuthTokensDto> {
    // jsonwebtoken's current types require expiresIn to be `number | ms.StringValue`
    // (a template-literal type like "15m"/"7d"), not a bare `string` — so a
    // value read out of ConfigService needs an explicit assertion here. We
    // control the .env.example defaults, so the format is guaranteed valid.
    const accessExpiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as StringValue;
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: accessExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  /**
   * Gui email chua link dat lai mat khau. Luon resolve thanh cong (khong
   * throw NotFound) du email co ton tai hay khong - tranh lo cho ke tan cong
   * do email nao da dang ky trong he thong (user enumeration).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return;

    // Token tho gui qua email cho nguoi dung; chi luu HASH (sha256) cua no
    // trong DB. Dung sha256 thay vi bcrypt o day vi can tim theo dung gia
    // tri (lookup by equality) khi nguoi dung bam vao link - bcrypt.compare
    // yeu cau da biet user truoc, khong dung de "tim nguoc" duoc.
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.usersService.setPasswordResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, user.username, resetLink);
  }

  /** Dat mat khau moi bang token nhan tu email (khong can biet mat khau cu). */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersService.findByValidPasswordResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    await this.usersService.resetPasswordViaToken(user.id, dto.newPassword);
  }
}
