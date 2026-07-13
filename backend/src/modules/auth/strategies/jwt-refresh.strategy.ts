import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshTokenPayload } from '../types/jwt-payload.type';
import { RequestUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  // We need the raw token (not just the decoded payload) to compare against
  // the bcrypt hash stored in users.refresh_token.
  validate(req: Request, payload: RefreshTokenPayload): RequestUser {
    const authHeader = req.get('authorization') ?? '';
    const refreshToken = authHeader.replace('Bearer', '').trim();
    return { userId: payload.sub, refreshToken };
  }
}
