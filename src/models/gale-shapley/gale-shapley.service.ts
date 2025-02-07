// gale-shapley.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Preference, Prisma } from '@prisma/client';
import { PrismaService } from '@shared/prisma/prisma.service';

type User = Prisma.UserGetPayload<{
  include: { preferences: true };
}>;

@Injectable()
export class GaleShapleyService {
  private readonly logger = new Logger(GaleShapleyService.name);

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.scheduleMatching();
  }

  private scheduleMatching() {
    const interval = setInterval(() => this.runMatching(), 24 * 60 * 60 * 1000);
    this.schedulerRegistry.addInterval('daily-matching', interval);
  }

  async runMatching() {
    try {
      const allUsers = await this.prisma.user.findMany({
        include: {
          preferences: true,
        },
      });

      // Kiểm tra và lọc users có preference hợp lệ
      const validUsers = allUsers.filter(
        (user) =>
          user.preferences.length > 0 &&
          user.preferences[0].preferredOrder.length > 0,
      );

      const proposers = validUsers.filter((u) => u.gender === 'MALE');
      const reviewers = validUsers.filter((u) => u.gender === 'FEMALE');

      if (proposers.length === 0 || reviewers.length === 0) {
        this.logger.warn('Không đủ users để thực hiện matching');
        return;
      }

      const matches = this.galeShapleyAlgorithm(proposers, reviewers);

      // Lưu kết quả matching theo batch
      await this.prisma.$transaction(
        Array.from(matches.entries()).map(([reviewerId, proposer]) =>
          this.prisma.match.create({
            data: {
              users: { connect: [{ id: proposer.id }, { id: reviewerId }] },
              stabilityScore: this.calculateStability(
                proposer,
                reviewerId,
                matches,
              ),
            },
          }),
        ),
      );

      this.logger.log(`Đã hoàn thành matching cho ${matches.size} cặp`);
    } catch (error) {
      this.logger.error('Lỗi trong quá trình matching:', error);
      throw error;
    }
  }

  private galeShapleyAlgorithm(
    proposers: User[],
    reviewers: User[],
  ): Map<string, User> {
    const matches = new Map<string, User>();
    const freeProposers = [...proposers];

    // Cache preferences để tối ưu hiệu suất
    const preferenceCache = new Map<
      string,
      {
        preferredOrder: string[];
        scoreMap: Map<string, number>;
      }
    >();

    // Khởi tạo cache
    for (const user of [...proposers, ...reviewers]) {
      const preference = user.preferences[0];
      const scoreMap = new Map<string, number>();

      preference.preferredOrder.forEach((userId, index) => {
        scoreMap.set(userId, preference.similarityScores[index]);
      });

      preferenceCache.set(user.id, {
        preferredOrder: [...preference.preferredOrder],
        scoreMap,
      });
    }

    while (freeProposers.length > 0) {
      const proposer = freeProposers[0];
      const proposerPrefs = preferenceCache.get(proposer.id)!;

      if (proposerPrefs.preferredOrder.length === 0) {
        freeProposers.shift();
        continue;
      }

      const reviewerId = proposerPrefs.preferredOrder[0];
      const reviewerPrefs = preferenceCache.get(reviewerId)!;

      if (!matches.has(reviewerId)) {
        matches.set(reviewerId, proposer);
        freeProposers.shift();
      } else {
        const currentMatch = matches.get(reviewerId)!;
        const currentScore = reviewerPrefs.scoreMap.get(currentMatch.id) || 0;
        const newScore = reviewerPrefs.scoreMap.get(proposer.id) || 0;

        if (newScore > currentScore) {
          matches.set(reviewerId, proposer);
          freeProposers.shift();
          freeProposers.push(currentMatch);
        }
      }

      proposerPrefs.preferredOrder.shift();
    }

    return matches;
  }

  private calculateStability(
    proposer: User,
    reviewerId: string,
    matches: Map<string, User>,
  ): number {
    let stabilityScore = 100;
    const proposerPrefs = proposer.preferences[0];
    const reviewerPrefs = this.getPreferences(reviewerId);

    if (!proposerPrefs || !reviewerPrefs) {
      return 0;
    }

    // Tính điểm ổn định dựa trên similarity scores
    const currentMatchScore = this.getScoreFromPreference(
      proposerPrefs,
      reviewerId,
    );
    const maxPossibleScore = Math.max(...proposerPrefs.similarityScores);

    // Normalization của điểm
    stabilityScore *= currentMatchScore / maxPossibleScore;

    // Kiểm tra blocking pairs
    for (const [otherReviewerId, otherProposer] of matches.entries()) {
      if (otherReviewerId === reviewerId) continue;

      const proposerPrefersOther =
        this.getScoreFromPreference(proposerPrefs, otherReviewerId) >
        currentMatchScore;

      const otherReviewerPrefs = this.getPreferences(otherReviewerId);
      if (!otherReviewerPrefs) continue;

      const otherReviewerPrefersProposer =
        this.getScoreFromPreference(otherReviewerPrefs, proposer.id) >
        this.getScoreFromPreference(otherReviewerPrefs, otherProposer.id);

      if (proposerPrefersOther && otherReviewerPrefersProposer) {
        stabilityScore -= 15;
      }
    }

    return Math.max(0, Math.round(stabilityScore));
  }

  private getPreferences(userId: string): Preference | null {
    const user = this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    return user?.preferences[0] || null;
  }

  private getScoreFromPreference(
    preference: Preference,
    targetUserId: string,
  ): number {
    const index = preference.preferredOrder.indexOf(targetUserId);
    return index !== -1 ? preference.similarityScores[index] : 0;
  }
}
