import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from '../mail/mail.service';

// Phai khop voi SALT_ROUNDS trong AuthService (modules/auth/auth.service.ts)
// de moi hash mat khau trong he thong nhat quan.
const SALT_ROUNDS = 10;

export interface CreateUserData {
  username: string;
  email: string;
  password: string; // already hashed by the caller (AuthService)
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === data.email ? 'Email already in use' : 'Username already taken',
      );
    }
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // password has select:false on the entity — must addSelect explicitly.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // refreshToken has select:false on the entity — must addSelect explicitly.
  findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async updateRefreshToken(id: number, refreshTokenHash: string | null): Promise<void> {
    await this.usersRepository.update(id, { refreshToken: refreshTokenHash });
  }

  async updateProfile(id: number, dto: UpdateUserDto): Promise<User | null> {
    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    // password co select:false tren entity nen phai addSelect thu cong,
    // giong cach lam trong findByEmailWithPassword o tren.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('User not found');

    const currentPasswordMatches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordIsSameAsOld = await bcrypt.compare(dto.newPassword, user.password);
    if (newPasswordIsSameAsOld) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.update(id, { password: newPasswordHash });

    // Doi mat khau xong thi thu hoi refresh token hien tai - ep dang xuat
    // khoi cac thiet bi/session khac, chi con phien vua doi mat khau la
    // con hieu luc (thong qua access token dang dung, se het han sau it phut).
    await this.updateRefreshToken(id, null);

    // Bao khong chan luong chinh: neu gui mail loi (SMTP down...) thi
    // nguoi dung van doi mat khau thanh cong binh thuong, chi la khong
    // nhan duoc mail thong bao. Khong throw ra ngoai o day.
    this.mailService.sendPasswordChangedEmail(user.email, user.username).catch(() => {});
  }

  // ── Quen mat khau / dat lai qua email ─────────────────────

  async setPasswordResetToken(id: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.usersRepository.update(id, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    });
  }

  // passwordResetToken/Expires co select:false tren entity - phai addSelect
  // thu cong. Tim theo hash cua token (khong phai token tho) va con han.
  findByValidPasswordResetToken(tokenHash: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordResetToken', 'user.passwordResetExpires'])
      .where('user.passwordResetToken = :tokenHash', { tokenHash })
      .andWhere('user.passwordResetExpires > :now', { now: new Date() })
      .getOne();
  }

  async resetPasswordViaToken(id: number, newPassword: string): Promise<void> {
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepository.update(id, {
      password: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null, // dang xuat khoi moi thiet bi, giong changePassword()
    });
  }
}
