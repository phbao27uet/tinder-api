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
import { CheckEmailDto, SignUpDto } from './dto/sign-up.dto';
import { hashPassword, isPasswordValid } from '@shared/utils';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LlmService } from '@models/llm/llm.service';
import { Interest } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private llmService: LlmService,
  ) { }

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

    const { embeddings, text } = await this.llmService.processUserData(dto);

    const currentUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        role: 'USER',
        images: dto.images,
        embeddings: embeddings,
        rawProfile: dto.rawProfile,
        interests: dto.interests as any,
        education: dto.education,
        birthday: dto.birthday,
        gender: dto.gender,
        lookingFor: dto.lookingFor,
        zodiac: dto.zodiacSign,
        futureFamily: dto.futureFamily,
        communicationStyle: dto.communicationStyle,
        loveLanguage: dto.loveLanguage,
        pet: dto.pet,
        alcoholConsumption: dto.alcoholConsumption,
        smoking: dto.smoking,
        exerciseHabit: dto.exerciseHabit,
        diet: dto.diet,
        socialMediaActivity: dto.socialMediaActivity,
        sleepHabit: dto.sleepHabit,
        languages: dto.languages,
        shortVideo: dto.shortVideo,
        preferredDistance: dto.preferredDistance, // JSON
      },
    });

    // Vector search với MongoDB Atlas
    const pipeline = [
      {
        $vectorSearch: {
          index: 'user_embeddings',
          path: 'embeddings',
          queryVector: currentUser.embeddings,
          numCandidates: 100,
          limit: 10, // Over-fetch để filter thêm
        },
      },
      {
        $match: {
          _id: { $ne: currentUser.id },
          // Thêm các điều kiện khác từ searchSettings
          // age: { $gte: currentUser.searchSettings?.minAge },
          // gender: { $in: currentUser.preferences?.genders },
        },
      },
      {
        $project: {
          _id: 1,
          rawProfile: 1,
          age: 1,
          gender: 1,
          score: {
            $meta: 'vectorSearchScore',
          },
        },
      },
    ];

    const matches = await this.prisma.user.aggregateRaw({
      pipeline,
    });

    return {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      text,
      matches,
    };
  }

  async checkEmail(dto: CheckEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    return {
      exists: !!user,
    };
  }

  async compare() {
    const users = await this.prisma.user.findMany({
      where: {
        email: {
          in: ['pqbao5@gmail.com', 'pqbao8@gmail.com'],
        },
      },
    });

    const scores = this.cosineSimilarity(
      users[0].embeddings,
      users[1].embeddings,
    );
    return scores;
  }

  private cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((acc, val) => acc + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((acc, val) => acc + val ** 2, 0));
    return dot / (normA * normB);
  }

  async login(dto: CredentialsDto) {
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

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
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

  async logout(userId: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshToken: {
          not: null,
        },
      },
      data: {
        refreshToken: null,
      },
    });
    return true;
  }

  async me(userId: string) {
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
    userId: string,
    rt: string,
  ): Promise<Omit<Tokens, 'refreshToken'>> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.refreshToken, rt);

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

  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await argon.hash(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hash,
      },
    });
  }

  async generateToken(sub: string, username: string, role = 'USER') {
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
