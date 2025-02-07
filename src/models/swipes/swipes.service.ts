import { BadRequestException, Injectable } from '@nestjs/common';
import { Direction } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class SwipesService {
  constructor(private prisma: PrismaService) { }

  async handleSwipe(
    swiperId: string,
    targetUserId: string,
    direction: Direction,
  ) {
    // Ghi lại swipe
    await this.prisma.swipe.create({
      data: {
        swiperId,
        targetUserId,
        direction,
      },
    });

    // Cập nhật preferences nếu là swipe phải
    if (direction) {
      await this.updateUserPreferences(swiperId, targetUserId);
    }
  }

  private async updateUserPreferences(userId: string, targetUserId: string) {
    // Tính toán similarity score
    const [user, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!user || !target) throw new BadRequestException('User not found');

    const similarity = this.cosineSimilarity(
      user.embeddings,
      target.embeddings,
    );

    // Thêm vào preferences
    await this.prisma.preference.upsert({
      where: { id: user.id },
      update: {
        preferredOrder: {
          push: targetUserId,
        },
        similarityScores: {
          push: similarity,
        },
      },
      create: {
        userId,
        preferredOrder: [targetUserId],
        similarityScores: [similarity],
      },
    });
  }

  private cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((acc, val) => acc + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((acc, val) => acc + val ** 2, 0));
    return dot / (normA * normB);
  }
}
