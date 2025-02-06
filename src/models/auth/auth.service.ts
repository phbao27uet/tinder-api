import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';

import { CredentialsDto } from './dto';
import { Tokens } from './types';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { JWT_CONSTANTS } from 'src/shared/utils/constants';
import { SignUpDto } from './dto/sign-up.dto';
import { hashPassword, isPasswordValid } from '@shared/utils';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignUpDto) {
    const userExist = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (userExist) {
      throw new ForbiddenException('Tài khoản đã tồn tại');
    }
    const hash = await argon.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        role: dto.role,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(dto: CredentialsDto) {
    console.log('dto', dto);

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });

    if (!user) throw new BadRequestException('Tài khoản không tồn tại');
    const { password, ...userWithoutPassword } = user;

    const passwordMatches = await isPasswordValid(dto.password, password);
    if (!passwordMatches) throw new BadRequestException('Mật khẩu không đúng');

    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refreshToken);

    return { ...tokens, user: userWithoutPassword };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        password: true,
      },
    });

    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    const passwordMatches = await isPasswordValid(
      changePasswordDto.current_password,
      user.password,
    );

    if (!passwordMatches)
      throw new BadRequestException('Mật khẩu cũ không đúng');

    const hash = await hashPassword(changePasswordDto.new_password);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hash,
      },
    });

    return true;
  }

  async logout(userId: number): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refresh_token: {
          not: null,
        },
      },
      data: {
        refresh_token: null,
      },
    });
    return true;
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  async refreshTokens(
    userId: number,
    rt: string,
  ): Promise<Omit<Tokens, 'refreshToken'>> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.refresh_token)
      throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.refresh_token, rt);

    console.log('rtMatches', rtMatches);

    // if (!rtMatches) throw new ForbiddenException('Access Denied 123');

    const newAccessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.name,
      },
      {
        secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
        expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
      },
    );

    return { accessToken: newAccessToken };
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await argon.hash(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: hash,
      },
    });
  }

  async generateToken(sub: number, username: string, role = 'USER') {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub,
          username,
          role,
        },
        {
          secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
          expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
        },
      ),
      this.jwtService.signAsync(
        {
          sub,
          username,
          role,
        },
        {
          secret: JWT_CONSTANTS.REFRESH_TOKEN_SECRET,
          expiresIn: JWT_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
