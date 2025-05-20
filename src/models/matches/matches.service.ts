import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { LangChainService } from '../langchain/langchain.service';
import { MessagesService } from '../messages/messages.service';
import { MatchStatus } from '@shared/enums/match-status.enum';
import { Direction } from '@prisma/client';
import { LlmService } from '@models/llm/llm.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private langchainService: LangChainService,
    private messagesService: MessagesService,
    private llmService: LlmService,
    // eslint-disable-next-line prettier/prettier
  ) { }

  /**
   * Get all matches for a specific user
   */
  async getUserMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        userIDs: {
          has: userId,
        },
        status: MatchStatus.ACCEPTED,
      },
      include: {
        users: {
          where: {
            id: {
              not: userId,
            },
          },
          select: {
            id: true,
            name: true,
            images: true,
            gender: true,
            birthday: true,
            interests: true,
            rawProfile: true,
          },
        },
      },
    });

    return matches;
  }

  /**
   * Get AI-powered match suggestions for a user
   * Combines Gale-Shapley algorithm with RAG recommendations
   */
  async getMatchSuggestions(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get vector similarity-based profiles
      const similarProfiles = await this.langchainService.getSimilarProfiles(
        userId,
        10,
      );

      // Get RAG-enhanced recommendations with detailed compatibility analysis
      const ragRecommendations =
        await this.langchainService.getRecommendations(userId);

      // Get existing pending matches
      const pendingMatches = await this.prisma.match.findMany({
        where: {
          userIDs: {
            has: userId,
          },
          status: MatchStatus.PENDING,
        },
        include: {
          users: {
            where: {
              id: {
                not: userId,
              },
            },
          },
        },
      });

      // Return combined results
      return {
        similarProfiles,
        pendingMatches,
        compatibilityAnalysis: ragRecommendations,
      };
    } catch (e) {
      console.log('err', e);

      return {
        similarProfiles: [],
        pendingMatches: [],
        compatibilityAnalysis: [],
      };
    }
  }

  /**
   * Get detailed information about a specific match
   */
  async getMatchDetails(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: {
        id: matchId,
        userIDs: {
          has: userId,
        },
      },
      include: {
        users: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Get the other user in the match
    const otherUser = match.users.find((user) => user.id !== userId);

    if (!otherUser) {
      throw new NotFoundException('Match partner not found');
    }

    // Generate conversation starters using LangChain
    const conversationStarters = await this.generateConversationStarters(
      userId,
      otherUser.id,
    );

    return {
      match,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        images: otherUser.images,
        interests: otherUser.interests,
        rawProfile: otherUser.rawProfile,
      },
      conversationStarters,
    };
  }

  /**
   * Create a new swipe record (like, dislike, superlike)
   */
  async createSwipe(
    swiperId: string,
    targetUserId: string,
    direction: Direction,
  ) {
    // Kiểm tra người dùng tồn tại
    const [swiper, targetUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: swiperId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!swiper || !targetUser) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem đã có swipe nào tồn tại chưa
    const existingSwipe = await this.prisma.swipe.findFirst({
      where: {
        swiperId,
        targetUserId,
      },
    });

    if (existingSwipe) {
      throw new ConflictException(
        'Bạn đã thực hiện swipe với người dùng này rồi',
      );
    }

    // Tạo swipe mới
    const swipe = await this.prisma.swipe.create({
      data: {
        swiperId,
        targetUserId,
        direction,
      },
    });

    // Nếu là like hoặc superlike, kiểm tra match
    if (direction === Direction.RIGHT || direction === Direction.UP) {
      const oppositeSwipe = await this.prisma.swipe.findFirst({
        where: {
          swiperId: targetUserId,
          targetUserId: swiperId,
          direction: {
            in: [Direction.RIGHT, Direction.UP],
          },
        },
      });

      // Nếu có match
      if (oppositeSwipe) {
        // Cập nhật swipe đã match
        await Promise.all([
          this.prisma.swipe.update({
            where: { id: swipe.id },
            data: { isMatched: true },
          }),
          this.prisma.swipe.update({
            where: { id: oppositeSwipe.id },
            data: { isMatched: true },
          }),
        ]);

        // Tạo match mới
        const newMatch = await this.prisma.match.create({
          data: {
            userIDs: [swiperId, targetUserId],
            users: {
              connect: [{ id: swiperId }, { id: targetUserId }],
            },
            status: MatchStatus.ACCEPTED,
            stabilityScore: 1.0, // Score mặc định cho match trực tiếp
          },
          include: {
            users: true,
          },
        });

        // Cập nhật thống kê
        if (direction === Direction.RIGHT) {
          await this.prisma.user.update({
            where: { id: targetUserId },
            data: { likesCount: { increment: 1 } },
          });
        } else if (direction === Direction.UP) {
          await this.prisma.user.update({
            where: { id: targetUserId },
            data: { superLikesCount: { increment: 1 } },
          });
        }

        try {
          const welcomeMessage = 'Chúc mừng! Các bạn đã match với nhau 🎉';

          await this.messagesService.sendMessage({
            senderId: swiperId,
            receiverId: targetUserId,
            matchId: newMatch.id,
            content: welcomeMessage,
          });
        } catch (error) {
          console.error('Lỗi khi gửi tin nhắn chào mừng:', error);
        }

        return {
          swipe,
          match: newMatch,
          isMatched: true,
        };
      }

      // Không match nhưng vẫn cập nhật thống kê
      if (direction === Direction.RIGHT) {
        await this.prisma.user.update({
          where: { id: targetUserId },
          data: { likesCount: { increment: 1 } },
        });
      } else if (direction === Direction.UP) {
        await this.prisma.user.update({
          where: { id: targetUserId },
          data: { superLikesCount: { increment: 1 } },
        });
      }
    }

    return {
      swipe,
      isMatched: false,
    };
  }

  /**
   * Generate conversation starters for two users
   */
  private async generateConversationStarters(userId1: string, userId2: string) {
    try {
      const user1 = await this.prisma.user.findUnique({
        where: { id: userId1 },
      });
      const user2 = await this.prisma.user.findUnique({
        where: { id: userId2 },
      });

      if (!user1 || !user2) {
        return [];
      }

      const suggestions = await this.llmService.generateConversationStarters(
        user1,
        user2,
      );

      return suggestions;
    } catch (error) {
      console.error('Error generating conversation starters:', error);
      return [
        'Cuối tuần bạn thích dành thời gian như thế nào nhất?',
        'Điều gì khiến bạn thực sự đam mê?',
        'Bạn có kế hoạch du lịch nào sắp tới không?',
      ];
    }
  }
}
