import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SearchSettingsDto } from './dto';

@Injectable()
export class SearchSettingsService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const searchSettings = await this.prisma.searchSetting.findUnique({
      where: {
        userId,
      },
    });

    return searchSettings;
  }

  async update(userId: string, searchSettingsDto: SearchSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updated = await this.prisma.searchSetting.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        ageRange: searchSettingsDto.ageRange,
        gender: searchSettingsDto.gender,
        preferredDistance: searchSettingsDto.preferredDistance,
        hasBio: searchSettingsDto.hasBio,
      },
      update: {
        ageRange: searchSettingsDto.ageRange,
        gender: searchSettingsDto.gender,
        preferredDistance: searchSettingsDto.preferredDistance,
        hasBio: searchSettingsDto.hasBio,
      },
    });

    return updated;
  }
}
