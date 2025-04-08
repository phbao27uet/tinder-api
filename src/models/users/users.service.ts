import { DefaultFindAllQueryDto } from '@models/base/dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '@shared/utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

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

  async findMatches(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(user.embeddings)
    
    // Vector search với MongoDB Atlas
    const pipeline = [
      {
        $vectorSearch: {
          index: "user_embeddings",
          path: "embeddings",
          queryVector: user.embeddings,
          numCandidates: 100,
          limit: 10, // Over-fetch để filter thêm
        },
      },
      {
        $match: {
          _id: { $ne: user.id },
          // Thêm các điều kiện khác từ searchSettings
          // age: { $gte: currentUser.searchSettings?.minAge },
          // gender: { $in: currentUser.preferences?.genders },
        },
      },
      {
        $project: { _id: 1, rawProfile: 1 },
      },
    ];
    
    const matches = await this.prisma.user.aggregateRaw({
      pipeline
    })

    const matchesCmd = await this.prisma.$runCommandRaw({
      aggregate: 'User',
      pipeline: [
        {
          $vectorSearch: {
            index: 'user_embeddings',
            path: 'embeddings',
            queryVector: user.embeddings,
            limit: 20,
            numCandidates: 100,
          },
        },
        { $match: { _id: { $ne: user.id } } },
        { $project: { _id: 1, rawProfile: 1 } },
      ],
    });


    return {matches, matchesCmd};
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

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: updateDto,
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
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
}
