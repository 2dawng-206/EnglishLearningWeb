import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { UserRole } from '../users/entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
}
