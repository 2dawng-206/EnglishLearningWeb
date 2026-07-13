import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
}
