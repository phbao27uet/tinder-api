/* eslint-disable prettier/prettier */
import { DefaultFindAllQueryDto } from '@models/base/dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '@shared/utils';
import { IUserMatch, LlmService } from '@models/llm/llm.service';
import { GaleShapleyService } from '@models/gale-shapley/gale-shapley.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  DESCRIPTIONS,
  GENDER,
  INTERESTS,
  EDUCATION,
  COMMUNICATION_STYLE,
  LOVE_LANGUAGE,
  PETS,
  ALCOHOL_CONSUMPTION,
  SMOKING_PREFERENCE,
  EXERCISE_FREQUENCY,
  DIETARY_PREFERENCE,
  SOCIAL_MEDIA_USAGE,
  SLEEP_PATTERN,
  LOOKING_FOR,
  ZODIAC_SIGN,
} from '@shared/utils/constants';
import { SignUpDto } from '@models/auth/dto/sign-up.dto';
import { AuthService } from '@models/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private galeShapleyService: GaleShapleyService,
    private authService: AuthService,
  ) { }

  async findAll(defaultFindAllQuery: DefaultFindAllQueryDto) {
    const {
      perPage = 20,
      page = 1,
      searchOne,
      searchMany,
    } = defaultFindAllQuery;

    const where: Prisma.UserWhereInput = {
      email: {
        in: searchMany,
        contains: searchOne,
        mode: 'insensitive',
      },
    };

    const [total, data] = await Promise.all([
      this.prisma.user.count({
        where: where,
      }),
      this.prisma.user.findMany({
        where: where,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        skip: page && perPage ? (page - 1) * perPage : undefined,
        take: page && perPage ? perPage : undefined,
      }),
    ]);

    return {
      data: data,
      meta: {
        currentPage: page,
        perPage,
        total: total ?? 0,
        totalPages: Math.ceil((total ?? 0) / perPage),
      },
    };
  }

  async getBalance(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      balance: user.balance,
    };
  }

  async findMatches(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Vector search with MongoDB Atlas
    const pipeline = [
      {
        $vectorSearch: {
          index: 'user_embeddings',
          path: 'embeddings',
          queryVector: user.embeddings,
          numCandidates: 100,
          limit: 10, // Over-fetch để filter thêm
        },
      },
      {
        $match: {
          _id: { $ne: { $oid: user.id } },
          // Thêm các điều kiện khác từ searchSettings
          // age: { $gte: currentUser.searchSettings?.minAge },
          // gender: { $in: currentUser.preferences?.genders },
        },
      },
      {
        $project: {
          _id: 1,
          rawProfile: 1,
          name: 1,
          email: 1,
          gender: 1,
          images: 1,
          embeddings: 1,
          birthday: 1,
          interests: 1,
          languages: 1,
          updatedAt: 1,
          createdAt: 1,
          address: 1,
          lat: 1,
          lng: 1,
          zodiac: 1,
          education: 1,
          futureFamily: 1,
          communicationStyle: 1,
          loveLanguage: 1,
          pet: 1,
          alcoholConsumption: 1,
          smoking: 1,
          exerciseHabit: 1,
          diet: 1,
          socialMediaActivity: 1,
          sleepHabit: 1,
          lookingFor: 1,
        },
      },
    ];

    const matches = await this.prisma.user.aggregateRaw({
      pipeline,
      options: {
        cursor: { batchSize: 100 },
      },
    });

    const analyzedMatches = await this.llmService.analyzeMatchesWithAI(
      user,
      matches as unknown as IUserMatch[],
    );

    return { matches, user, analyzedMatches };
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, role, embeddings, job, ...rest } = user;

    return rest;
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userUpdated = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        images: updateDto.images,
        rawProfile: updateDto.rawProfile,
        interests: updateDto.interests as any,
        education: updateDto.education,
        lookingFor: updateDto.lookingFor,
        zodiac: updateDto.zodiacSign,
        futureFamily: updateDto.futureFamily,
        communicationStyle: updateDto.communicationStyle,
        loveLanguage: updateDto.loveLanguage,
        pet: updateDto.pet,
        alcoholConsumption: updateDto.alcoholConsumption,
        smoking: updateDto.smoking,
        exerciseHabit: updateDto.exerciseHabit,
        diet: updateDto.diet,
        socialMediaActivity: updateDto.socialMediaActivity,
        sleepHabit: updateDto.sleepHabit,
      },
    });

    const { embeddings } = await this.llmService.processUserData({
      email: userUpdated.email,
      name: userUpdated.name as string,
      birthday: userUpdated.birthday?.toString(),
      gender: userUpdated.gender as 'MALE' | 'FEMALE',
      password: userUpdated.password,
      languages: userUpdated.languages,
      shortVideo: userUpdated.shortVideo as string,
      rawProfile: updateDto.rawProfile,
      interests: updateDto.interests as any,
      education: updateDto.education,
      lookingFor: updateDto.lookingFor,
      zodiacSign: updateDto.zodiacSign,
      futureFamily: updateDto.futureFamily,
      communicationStyle: updateDto.communicationStyle,
      loveLanguage: updateDto.loveLanguage,
      pet: updateDto.pet,
      alcoholConsumption: updateDto.alcoholConsumption,
      smoking: updateDto.smoking,
      exerciseHabit: updateDto.exerciseHabit,
      diet: updateDto.diet,
      socialMediaActivity: updateDto.socialMediaActivity,
      sleepHabit: updateDto.sleepHabit,
      images: updateDto.images,
    });

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        embeddings,
      },
    });

    await this.galeShapleyService.run(id);

    return {
      id: userUpdated.id,
      email: userUpdated.email,
      role: userUpdated.role,
    };
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }

  async changePassword(id: string, updateDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hash = await hashPassword(updateDto.new_password);

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hash,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async getSubscriptionHistory(userId: string) {
    // Get user's current and past VIP subscriptions
    const subscriptionHistory = await this.prisma.vipSubscription.findMany({
      where: {
        userId: userId,
      },
      include: {
        vipPackage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptionHistory.map(subscription => ({
      id: subscription.id,
      packageName: subscription.vipPackage.name,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive: subscription.isActive,
      paymentMethod: subscription.paymentMethod,
      price: subscription.vipPackage.price,
      purchasedAt: subscription.createdAt
    }));
  }

  async getMatchHistory(userId: string) {
    // Get all matches for the current user
    const matches = await this.prisma.match.findMany({
      where: {
        userIDs: {
          has: userId,
        },
        status: 'ACCEPTED', // Only show accepted matches
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            images: true,
            gender: true,
            birthday: true,
            interests: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Get latest message
        },
      },
      orderBy: {
        matchDate: 'desc',
      },
    });

    return matches.map(match => {
      // Find the other user in the match (not the current user)
      const otherUser = match.users.find(user => user.id !== userId);

      return {
        id: match.id,
        matchDate: match.matchDate,
        stabilityScore: match.stabilityScore,
        matchedUser: otherUser,
        lastMessage: match.messages[0] || null,
      };
    });
  }

  async updateLocation(id: string, updateDto: UpdateLocationDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userUpdated = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        latitude: updateDto.latitude,
        longitude: updateDto.longitude,
      },
    });

    return userUpdated;
  }

  async generate() {
    // Base sample data provided in the request
    const baseSample = {
      email: 'tider3@gmail.com',
      password: '123123aa',
      name: 'Tinder 3',
      images: [
        'https://firebasestorage.googleapis.com/v0/b/file-storage-6ac01.appspot.com/o/tinder%2Fimages%2F2025%2F05%2F06%2F25DA37F7-9604-4555-A4F3-A435A5A9871F.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/file-storage-6ac01.appspot.com/o/tinder%2Fimages%2F2025%2F05%2F06%2FC5D7D47F-0E60-47BD-8F3B-39A79D8A6EB4.jpg?alt=media',
      ],
    };

    // Pre-compute hashed password once
    const hashedPassword = await hashPassword(baseSample.password);

    // Helper to pick a random item from an array
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const genderKeys = Object.keys(GENDER);
    const interestKeys = Object.keys(INTERESTS);

    const lookingForKeys = Object.keys(LOOKING_FOR);
    const zodiacKeys = Object.keys(ZODIAC_SIGN);
    const educationKeys = Object.keys(EDUCATION);
    const commKeys = Object.keys(COMMUNICATION_STYLE);
    const loveLangKeys = Object.keys(LOVE_LANGUAGE);
    const petKeys = Object.keys(PETS);
    const alcoholKeys = Object.keys(ALCOHOL_CONSUMPTION);
    const smokingKeys = Object.keys(SMOKING_PREFERENCE);
    const exerciseKeys = Object.keys(EXERCISE_FREQUENCY);
    const dietKeys = Object.keys(DIETARY_PREFERENCE);
    const socialKeys = Object.keys(SOCIAL_MEDIA_USAGE);
    const sleepKeys = Object.keys(SLEEP_PATTERN);

    // Build 50 random users
    for (let i = 20; i <= 50; i++) {
      console.log(`Generated user ${i}`);
      const userData: SignUpDto = {
        email: '',
        password: '',
        name: '',
        images: [
          'https://firebasestorage.googleapis.com/v0/b/file-storage-6ac01.appspot.com/o/tinder%2Fimages%2F2025%2F05%2F06%2F25DA37F7-9604-4555-A4F3-A435A5A9871F.jpg?alt=media',
          'https://firebasestorage.googleapis.com/v0/b/file-storage-6ac01.appspot.com/o/tinder%2Fimages%2F2025%2F05%2F06%2FC5D7D47F-0E60-47BD-8F3B-39A79D8A6EB4.jpg?alt=media',
        ],
        rawProfile: '',
      }


      const idx = i;

      // Generate unique email and name
      const email = `tinder${idx}@gmail.com`;
      const name = `Tinder ${idx}`;

      // Random interests (3-6 unique interests)
      const interestsSet = new Set<string>();
      const interestsCount = 3 + Math.floor(Math.random() * 4); // 3-6
      while (interestsSet.size < interestsCount) {
        interestsSet.add(pick(interestKeys));
      }

      userData.email = email;
      userData.password = hashedPassword;
      userData.name = name;
      userData.gender = pick(genderKeys) as any;
      userData.rawProfile = pick(DESCRIPTIONS);
      userData.interests = Array.from(interestsSet) as any;
      userData.lookingFor = pick(lookingForKeys) as any;
      userData.zodiacSign = pick(zodiacKeys) as any;
      userData.education = pick(educationKeys) as any;
      userData.communicationStyle = pick(commKeys) as any;
      userData.loveLanguage = pick(loveLangKeys) as any;
      userData.pet = pick(petKeys) as any;
      userData.alcoholConsumption = pick(alcoholKeys) as any;
      userData.smoking = pick(smokingKeys) as any;
      userData.exerciseHabit = pick(exerciseKeys) as any;
      userData.diet = pick(dietKeys) as any;
      userData.socialMediaActivity = pick(socialKeys) as any;
      userData.sleepHabit = pick(sleepKeys) as any;
      // Giá trị mặc định cho preferredDistance trong searchSetting
      userData.preferredDistance = Math.floor(Math.random() * 100);

      await this.authService.signup(userData);

      console.log(`Generated user ${i} successfully`);
      console.log(`Waiting for 60 seconds before generating user ${i + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    return { message: `Generated users successfully` };
  }
}
