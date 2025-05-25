// gale-shapley.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Preference, Prisma } from '@prisma/client';
import { PrismaService } from '@shared/prisma/prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { LlmService, IUserMatch } from '@models/llm/llm.service';
import { getDistance } from '@shared/utils/distance';
import { INTERESTS_ARRAY } from '@shared/utils';

/**
 * Định nghĩa kiểu User mở rộng với preferences
 */
type User = Prisma.UserGetPayload<{
  include: { preferences: true; searchSetting: true };
}>;

/**
 * Định nghĩa type để lưu trữ thứ tự ưu tiên và điểm số
 */
type PreferenceInfo = {
  preferredOrder: string[];
  scoreMap: Map<string, number>;
};

/**
 * Định nghĩa kiểu dữ liệu cho người dùng được gợi ý
 */
export type UserSuggestion = {
  id: string;
  name: string;
  images: string[];
  gender: string;
  similarityScore: number;
  interests: string[];
  additionalInfo?: {
    rawProfile?: string;
    lookingFor?: string;
    zodiac?: string;
    education?: string;
    loveLanguage?: string;
    pet?: string;
    alcoholConsumption?: string;
    smoking?: string;
    exerciseHabit?: string;
    diet?: string;
    socialMediaActivity?: string;
    sleepHabit?: string;
    communicationStyle?: string;
    distance?: string;
  };
};

@Injectable()
export class GaleShapleyService {
  private readonly logger = new Logger(GaleShapleyService.name);

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private llmService: LlmService,
  ) {
    // Thiết lập lịch chạy thuật toán matching tự động
    this.scheduleMatching();
  }

  /**
   * Lên lịch chạy thuật toán matching mỗi ngày một lần
   * Sử dụng SchedulerRegistry để quản lý các interval
   */
  private scheduleMatching() {
    // Thiết lập interval chạy mỗi 24 giờ (24 * 60 * 60 * 1000 ms)
    // const interval = setInterval(() => this.runMatching(), 24 * 60 * 60 * 1000);
    // this.schedulerRegistry.addInterval('daily-matching', interval);
    // this.runMatching();
  }

  /**
   * Thực hiện việc matching cho tất cả người dùng hợp lệ trong hệ thống
   * Sử dụng thuật toán Gale-Shapley để tìm các cặp ghép ổn định
   */
  async runMatching() {
    try {
      this.logger.log('Bắt đầu quá trình matching cho người dùng');

      // Lấy tất cả người dùng có bao gồm dữ liệu preferences
      const allUsers = await this.prisma.user.findMany({
        include: {
          preferences: true,
          searchSetting: true,
        },
      });

      // Lọc người dùng có dữ liệu preference hợp lệ (có preferences và có preferredOrder không rỗng)
      const usersWithPreferences = allUsers.filter(
        (user) =>
          user.preferences.length > 0 &&
          user.preferences[0].preferredOrder.length > 0,
      );

      this.logger.log(
        `Tìm thấy ${usersWithPreferences.length} người dùng có dữ liệu preference hợp lệ`,
      );

      // Tìm người dùng không có preferredOrder hoặc preferredOrder rỗng
      const usersWithoutPreferences = allUsers.filter(
        (user) =>
          user.preferences.length === 0 ||
          user.preferences[0].preferredOrder.length === 0,
      );

      this.logger.log(
        `Cần tính toán preferences cho ${usersWithoutPreferences.length} người dùng`,
      );

      // Tính toán preferences cho người dùng chưa có
      if (usersWithoutPreferences.length > 0) {
        await this.calculateAndSavePreferences(
          usersWithoutPreferences,
          allUsers,
        );
      }

      // Lấy lại danh sách người dùng sau khi đã tính toán preferences
      const validUsers = await this.prisma.user.findMany({
        where: {
          preferences: {
            some: {
              preferredOrder: {
                isEmpty: false,
              },
            },
          },
        },
        include: {
          preferences: true,
          searchSetting: true,
        },
      });

      this.logger.log(
        `Sau khi tính toán: ${validUsers.length} người dùng có dữ liệu preference hợp lệ`,
      );

      // Phân chia người dùng thành hai nhóm theo giới tính để áp dụng thuật toán Gale-Shapley
      // Trong Gale-Shapley, cần có hai nhóm: nhóm đề xuất (proposers) và nhóm xem xét (reviewers)
      const proposers = validUsers.filter((u) => u.gender === 'MALE');
      const reviewers = validUsers.filter((u) => u.gender === 'FEMALE');

      // Kiểm tra xem có đủ người dùng để thực hiện matching không
      if (proposers.length === 0 || reviewers.length === 0) {
        this.logger.warn('Không đủ người dùng để thực hiện matching');
        return;
      }

      this.logger.log(
        `Áp dụng thuật toán Gale-Shapley với ${proposers.length} proposers và ${reviewers.length} reviewers`,
      );

      // Chạy thuật toán Gale-Shapley để tìm các cặp ghép ổn định
      const matches = this.galeShapleyAlgorithm(proposers, reviewers);

      // Lưu các cặp ghép vào cơ sở dữ liệu bằng transaction để đảm bảo tính toàn vẹn
      await this.saveMatchesToDatabase(matches);

      this.logger.log(`Hoàn thành matching cho ${matches.size} cặp`);
    } catch (error) {
      this.logger.error('Lỗi trong quá trình matching:', error);
      throw error;
    }
  }

  /**
   * Lưu kết quả ghép cặp vào cơ sở dữ liệu
   * @param matches Map các cặp ghép (reviewerId -> proposer)
   */
  private async saveMatchesToDatabase(matches: Map<string, User>) {
    this.logger.log(`Lưu ${matches.size} cặp ghép vào cơ sở dữ liệu`);

    // Sử dụng transaction để đảm bảo tất cả các bản ghi được tạo hoặc không có bản ghi nào được tạo
    await this.prisma.$transaction(
      Array.from(matches.entries()).map(([reviewerId, proposer]) =>
        this.prisma.match.create({
          data: {
            // Kết nối cả hai người dùng vào bản ghi match
            users: { connect: [{ id: proposer.id }, { id: reviewerId }] },
            // Tính và lưu điểm ổn định của cặp ghép
            stabilityScore: this.calculateStability(
              proposer,
              reviewerId,
              matches,
            ),
            // Thêm trường matchDate để theo dõi thời gian tạo match
            matchDate: new Date(),
          },
        }),
      ),
    );
  }

  /**
   * Triển khai thuật toán Gale-Shapley (còn gọi là thuật toán stable matching)
   *
   * Thuật toán Gale-Shapley hoạt động như sau:
   * 1. Ban đầu, tất cả proposers đều tự do (chưa được ghép đôi)
   * 2. Mỗi proposer sẽ đề xuất ghép đôi với reviewer họ ưa thích nhất mà họ chưa từng đề xuất
   * 3. Nếu reviewer chưa được ghép đôi, họ chấp nhận đề xuất
   * 4. Nếu reviewer đã được ghép đôi, họ sẽ so sánh người đang ghép đôi với họ và người mới
   *    đề xuất, và chọn người họ ưa thích hơn
   * 5. Quá trình này tiếp tục cho đến khi không còn proposer tự do hoặc không còn đề xuất nào để thực hiện
   *
   * @param proposers Danh sách người dùng nhóm đề xuất (proposer)
   * @param reviewers Danh sách người dùng nhóm xem xét (reviewer)
   * @returns Map chứa các cặp ghép ổn định (reviewerId -> proposer)
   */
  private galeShapleyAlgorithm(
    proposers: User[],
    reviewers: User[],
  ): Map<string, User> {
    // Map lưu trữ kết quả các cặp ghép: reviewerId -> proposer
    const matches = new Map<string, User>();

    // Danh sách các proposer chưa được ghép cặp
    const freeProposers = [...proposers];

    // Cache thông tin preference để tránh truy vấn lặp lại và tăng hiệu suất
    const preferenceCache = new Map<string, PreferenceInfo>();

    // Khởi tạo cache preferences cho tất cả người dùng
    this.initializePreferenceCache(preferenceCache, proposers, reviewers);

    // Thuật toán Gale-Shapley
    // Tiếp tục cho đến khi không còn proposer tự do hoặc tất cả proposer đã thử tất cả các lựa chọn
    while (freeProposers.length > 0) {
      // Lấy proposer đầu tiên trong danh sách
      const proposer = freeProposers[0];
      const proposerPrefs = preferenceCache.get(proposer.id)!;

      // Nếu proposer đã hết lựa chọn, loại bỏ khỏi danh sách
      if (proposerPrefs.preferredOrder.length === 0) {
        freeProposers.shift();
        continue;
      }

      // Lấy reviewer ưa thích nhất tiếp theo của proposer
      const reviewerId = proposerPrefs.preferredOrder[0];

      // Loại bỏ reviewer này khỏi danh sách ưa thích (để không đề xuất lại)
      proposerPrefs.preferredOrder.shift();

      // Lấy thông tin preference của reviewer
      const reviewerPrefs = preferenceCache.get(reviewerId);

      // Nếu không tìm thấy preference của reviewer, bỏ qua
      if (!reviewerPrefs) {
        continue;
      }

      // Nếu reviewer chưa được ghép đôi, ghép với proposer hiện tại
      if (!matches.has(reviewerId)) {
        matches.set(reviewerId, proposer);
        // Loại bỏ proposer khỏi danh sách tự do
        freeProposers.shift();
      } else {
        // Nếu reviewer đã được ghép đôi, so sánh với proposer hiện tại
        const currentMatch = matches.get(reviewerId)!;

        // Lấy điểm ưa thích của reviewer đối với các proposers
        const currentScore = reviewerPrefs.scoreMap.get(currentMatch.id) || 0;
        const newScore = reviewerPrefs.scoreMap.get(proposer.id) || 0;

        // Nếu reviewer ưa thích proposer mới hơn, thay đổi ghép đôi
        if (newScore > currentScore) {
          matches.set(reviewerId, proposer);
          // Loại bỏ proposer mới khỏi danh sách tự do
          freeProposers.shift();
          // Đưa proposer cũ trở lại danh sách tự do
          freeProposers.push(currentMatch);
        }
      }
    }

    return matches;
  }

  /**
   * Khởi tạo cache lưu trữ thông tin preferences để tối ưu hiệu suất thuật toán
   * @param preferenceCache Map lưu trữ thông tin preference
   * @param proposers Danh sách proposers
   * @param reviewers Danh sách reviewers
   */
  private initializePreferenceCache(
    preferenceCache: Map<string, PreferenceInfo>,
    proposers: User[],
    reviewers: User[],
  ) {
    // Khởi tạo cache cho tất cả người dùng (cả proposers và reviewers)
    for (const user of [...proposers, ...reviewers]) {
      // Chỉ xử lý người dùng có preferences
      if (user.preferences.length === 0) continue;

      const preference = user.preferences[0];
      // Nếu không có preferredOrder, bỏ qua
      if (!preference.preferredOrder || !preference.similarityScores) continue;

      // Map lưu trữ điểm số của mỗi người dùng trong preferredOrder
      const scoreMap = new Map<string, number>();

      // Đảm bảo độ dài của preferredOrder và similarityScores khớp nhau
      const minLength = Math.min(
        preference.preferredOrder.length,
        preference.similarityScores.length,
      );

      // Lưu trữ điểm số cho mỗi người dùng trong preferredOrder
      for (let i = 0; i < minLength; i++) {
        const userId = preference.preferredOrder[i];
        const score = preference.similarityScores[i];
        scoreMap.set(userId, score);
      }

      // Lưu vào cache
      preferenceCache.set(user.id, {
        // Tạo bản sao của preferredOrder để tránh thay đổi dữ liệu gốc
        preferredOrder: [...preference.preferredOrder.slice(0, minLength)],
        scoreMap,
      });
    }
  }

  /**
   * Tính điểm ổn định (stability) của một cặp ghép
   * Độ ổn định là thước đo mức độ hài lòng của cả hai người trong cặp ghép
   * và khả năng họ sẽ không muốn rời bỏ nhau để ghép đôi với người khác
   *
   * @param proposer Người dùng proposer
   * @param reviewerId ID của reviewer
   * @param matches Map chứa tất cả các cặp ghép
   * @returns Điểm ổn định từ 0-100, càng cao càng ổn định
   */
  private calculateStability(
    proposer: User,
    reviewerId: string,
    matches: Map<string, User>,
  ): number {
    // Điểm ổn định ban đầu là 100 (tối đa)
    let stabilityScore = 100;

    // Lấy preferences của cả proposer và reviewer
    const proposerPrefs = proposer.preferences[0];
    const reviewerPrefs = this.getPreferences(reviewerId);

    // Nếu không có dữ liệu preference, không thể tính độ ổn định
    if (!proposerPrefs || !reviewerPrefs) {
      return 0;
    }

    // Tính điểm ổn định dựa trên điểm tương đồng (similarity scores)
    // Điểm tương đồng càng cao thì độ ổn định càng lớn
    const currentMatchScore = this.getScoreFromPreference(
      proposerPrefs,
      reviewerId,
    );

    // Điểm tương đồng tối đa có thể có
    const maxPossibleScore = Math.max(...proposerPrefs.similarityScores);

    // Chuẩn hóa điểm ổn định theo tỷ lệ điểm tương đồng hiện tại / điểm tối đa
    stabilityScore *= currentMatchScore / maxPossibleScore;

    // Kiểm tra các cặp blocking (cặp có thể phá vỡ sự ổn định của hệ thống)
    // Một cặp (A,B) là blocking pair nếu:
    // - A hiện đang ghép với C nhưng thích B hơn C
    // - B hiện đang ghép với D nhưng thích A hơn D
    this.checkBlockingPairs(
      proposer,
      reviewerId,
      matches,
      proposerPrefs,
      stabilityScore,
    );

    // Đảm bảo điểm ổn định không âm và làm tròn thành số nguyên
    return Math.max(0, Math.round(stabilityScore));
  }

  /**
   * Kiểm tra các cặp blocking có thể làm giảm độ ổn định của hệ thống
   * @param proposer Người dùng proposer
   * @param reviewerId ID của reviewer
   * @param matches Map chứa tất cả các cặp ghép
   * @param proposerPrefs Preferences của proposer
   * @param stabilityScore Điểm ổn định (tham chiếu, có thể thay đổi)
   */
  private async checkBlockingPairs(
    proposer: User,
    reviewerId: string,
    matches: Map<string, User>,
    proposerPrefs: Preference,
    stabilityScore: number,
  ) {
    // Kiểm tra với tất cả các cặp ghép khác trong hệ thống
    for (const [otherReviewerId, otherProposer] of matches.entries()) {
      // Bỏ qua nếu đang xét chính cặp ghép hiện tại
      if (otherReviewerId === reviewerId) continue;

      // Điểm tương đồng hiện tại của proposer với reviewer
      const currentMatchScore = this.getScoreFromPreference(
        proposerPrefs,
        reviewerId,
      );

      // Kiểm tra xem proposer có thích reviewer khác hơn reviewer hiện tại không
      const proposerPrefersOther =
        this.getScoreFromPreference(proposerPrefs, otherReviewerId) >
        currentMatchScore;

      // Nếu proposer thích reviewer khác hơn, kiểm tra xem reviewer khác có thích proposer này hơn không
      if (proposerPrefersOther) {
        const otherReviewerPrefs = await this.getPreferences(otherReviewerId);
        if (!otherReviewerPrefs) continue;

        // Kiểm tra xem reviewer khác có thích proposer này hơn proposer hiện tại của họ không
        const otherReviewerPrefersProposer =
          this.getScoreFromPreference(otherReviewerPrefs, proposer.id) >
          this.getScoreFromPreference(otherReviewerPrefs, otherProposer.id);

        // Nếu cả hai đều thích nhau hơn người họ đang ghép đôi, đây là blocking pair
        // Giảm điểm ổn định vì hệ thống có thể không ổn định
        if (otherReviewerPrefersProposer) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          stabilityScore -= 15; // Giảm 15 điểm cho mỗi blocking pair
        }
      }
    }
  }

  /**
   * Lấy preference của một người dùng từ cơ sở dữ liệu
   * @param userId ID của người dùng
   * @returns Preference của người dùng hoặc null nếu không tồn tại
   */
  private async getPreferences(userId: string): Promise<Preference | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    return user?.preferences[0] || null;
  }

  /**
   * Tính toán và lưu preferences cho danh sách người dùng chưa có preferences
   * @param users Danh sách người dùng cần tính toán preferences
   * @param allUsers Tất cả người dùng trong hệ thống
   */
  private async calculateAndSavePreferences(users: User[], allUsers: User[]) {
    this.logger.log(
      `Bắt đầu tính toán preferences cho ${users.length} người dùng`,
    );

    // Xử lý từng người dùng
    for (const user of users) {
      try {
        // Chọn các ứng viên phù hợp dựa trên criteria của người dùng
        const potentialMatches = this.findPotentialMatches(user, allUsers);

        if (potentialMatches.length === 0) {
          this.logger.warn(
            `Không tìm thấy ứng viên phù hợp cho người dùng ${user.id}`,
          );
          continue;
        }

        this.logger.log(
          `Tìm thấy ${potentialMatches.length} ứng viên tiềm năng cho người dùng ${user.id}`,
        );

        // Chuyển đổi từ User sang IUserMatch để sử dụng với LlmService
        const convertedMatches = potentialMatches.map(this.convertToIUserMatch);

        // Sử dụng AI để phân tích mức độ tương thích
        const analysisResults = await this.llmService.analyzeMatchesWithAI(
          user,
          convertedMatches,
        );

        // Lưu preferences vào database
        await this.saveUserPreferences(user.id, analysisResults);

        this.logger.log(
          `Đã tính toán và lưu preferences cho người dùng ${user.id}`,
        );

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            // Cập nhật trường lastIndexed để theo dõi thời gian cập nhật preferences
            lastIndexed: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(
          `Lỗi khi tính toán preferences cho người dùng ${user.id}:`,
          error,
        );
      }
    }
  }

  /**
   * Tìm các ứng viên tiềm năng phù hợp với criteria của người dùng
   * @param user Người dùng cần tìm match
   * @param allUsers Tất cả người dùng trong hệ thống
   * @returns Danh sách ứng viên tiềm năng
   */
  private findPotentialMatches(user: User, allUsers: User[]): User[] {
    return allUsers.filter((potentialMatch) => {
      // Bỏ qua chính người dùng
      if (potentialMatch.id === user.id) return false;

      // Lọc theo khoảng cách
      if (
        user.searchSetting?.preferredDistance &&
        potentialMatch.longitude &&
        potentialMatch.latitude
      ) {
        const distance = getDistance(
          user.latitude || 0,
          user.longitude || 0,
          potentialMatch.latitude || 0,
          potentialMatch.longitude || 0,
        );
        if (distance > user.searchSetting.preferredDistance) {
          return false;
        }
      }

      // Lọc theo giới tính
      if (user.searchSetting?.gender) {
        if (
          user.searchSetting?.gender === 'MALE' &&
          potentialMatch.gender !== 'MALE'
        ) {
          return false;
        }
        if (
          user.searchSetting?.gender === 'FEMALE' &&
          potentialMatch.gender !== 'FEMALE'
        ) {
          return false;
        }
      } else {
        // Neu khong setting gioi tinh, thi loc theo gioi tinh cua potentialMatch
        return user.gender !== potentialMatch.gender;
      }

      // Loc theo Bio
      if (user.searchSetting?.hasBio) {
        if (!potentialMatch.rawProfile) {
          return false;
        }
      }

      // Lọc theo độ tuổi
      if (user.searchSetting?.ageRange && potentialMatch.birthday) {
        const age = this.calculateAge(potentialMatch.birthday.toString());
        if (
          age < user.searchSetting.ageRange[0] ||
          age > user.searchSetting.ageRange[1]
        ) {
          return false;
        }
      }
      return true;
    });
  }

  private calculateAge(birthday: string): number {
    if (!birthday) return 0;

    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Chuyển đổi từ User sang IUserMatch để sử dụng với LlmService
   * @param user Người dùng cần chuyển đổi
   * @returns IUserMatch object
   */
  private convertToIUserMatch(user: User): IUserMatch {
    return {
      _id: { $oid: user.id },
      email: user.email,
      images: user.images || [],
      name: user.name || '',
      gender: user.gender as 'MALE' | 'FEMALE' | 'OTHER',
      // preferredDistance: user.preferredDistance || 50,
      rawProfile: user.rawProfile || '',
      interests: user.interests || [],
      embeddings: user.embeddings || [],
      lookingFor: user.lookingFor || '',
      languages: user.languages || [],
      zodiac: user.zodiac || '',
      education: user.education || '',
      communicationStyle: user.communicationStyle || '',
      loveLanguage: user.loveLanguage || '',
      pet: user.pet?.toString() || '',
      alcoholConsumption: user.alcoholConsumption?.toString() || '',
      smoking: user.smoking?.toString() || '',
      exerciseHabit: user.exerciseHabit?.toString() || '',
      diet: user.diet?.toString() || '',
      socialMediaActivity: user.socialMediaActivity?.toString() || '',
      sleepHabit: user.sleepHabit?.toString() || '',
    };
  }

  /**
   * Lưu kết quả phân tích AI vào bảng preferences
   * @param userId ID của người dùng
   * @param analysisResults Kết quả phân tích từ AI
   */
  private async saveUserPreferences(
    userId: string,
    analysisResults: {
      preferredOrder: string[];
      similarityScores: number[];
      details: any[];
    },
  ) {
    // Kiểm tra xem người dùng đã có preference chưa
    const existingPreference = await this.prisma.preference.findFirst({
      where: { userId },
    });

    if (existingPreference) {
      // Cập nhật preference hiện có
      await this.prisma.preference.update({
        where: { id: existingPreference.id },
        data: {
          preferredOrder: analysisResults.preferredOrder,
          similarityScores: analysisResults.similarityScores,
          // Lưu chi tiết vào cột lastUpdated dưới dạng Date
          lastUpdated: new Date(),
        },
      });

      // Lưu chi tiết phân tích vào bảng riêng nếu cần
      this.logger.log(
        `Đã cập nhật preferences cho userId: ${userId} với ${analysisResults.preferredOrder.length} preferredOrder`,
      );
    } else {
      // Tạo preference mới
      await this.prisma.preference.create({
        data: {
          userId,
          preferredOrder: analysisResults.preferredOrder,
          similarityScores: analysisResults.similarityScores,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(
        `Đã tạo mới preferences cho userId: ${userId} với ${analysisResults.preferredOrder.length} preferredOrder`,
      );
    }
  }

  /**
   * Lấy điểm tương đồng của một người dùng đối với một người dùng khác từ preference
   * @param preference Preference chứa thông tin đánh giá
   * @param targetUserId ID của người dùng mục tiêu
   * @returns Điểm tương đồng hoặc 0 nếu không tìm thấy
   */
  private getScoreFromPreference(
    preference: Preference,
    targetUserId: string,
  ): number {
    // Tìm vị trí của targetUserId trong preferredOrder
    const index = preference.preferredOrder.indexOf(targetUserId);
    // Nếu tìm thấy, trả về điểm tương đồng tương ứng; nếu không, trả về 0
    return index !== -1 ? preference.similarityScores[index] : 0;
  }

  /**
   * Lấy danh sách gợi ý cho người dùng dựa trên preferences của họ
   * @param userId ID của người dùng cần lấy gợi ý
   * @returns Danh sách người dùng được gợi ý kèm theo điểm tương đồng
   */
  async getUserSuggestions(userId: string): Promise<UserSuggestion[]> {
    // Kiểm tra người dùng tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, searchSetting: true },
    });

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với ID: ${userId}`,
      );
    }

    // Lấy preferences của người dùng
    const userPreference = user.preferences[0];

    const swipedUsers = await this.prisma.swipe.findMany({
      where: {
        swiperId: userId,
      },
      select: {
        targetUserId: true,
      },
    });

    const swipedUserIds = swipedUsers.map((swipe) => swipe.targetUserId);

    // Lấy tất cả người dùng để lọc theo preferredOrder
    const allUsers = await this.prisma.user.findMany({
      include: { preferences: true, searchSetting: true },
      where: {
        id: {
          notIn: [userId, ...swipedUserIds],
        },
      },
    });

    const checkLastIndexed = allUsers.some(
      (u) => user.lastIndexed && u.createdAt > user.lastIndexed,
    );

    if (checkLastIndexed) {
      this.logger.log(
        `Người dùng ${userId} có dữ liệu mới, cần tính toán lại preferences...`,
      );
    }

    // Nếu chưa có preferences, cần tính toán trước
    if (
      !userPreference ||
      userPreference.preferredOrder.length === 0 ||
      checkLastIndexed
    ) {
      this.logger.log(
        `Người dùng ${userId} chưa có preferences, tiến hành tính toán...`,
      );

      // Lấy tất cả người dùng
      const allUsers = await this.prisma.user.findMany({
        include: { preferences: true, searchSetting: true },
        where: {
          id: {
            notIn: [userId, ...swipedUserIds],
          },
        },
      });

      const filteredUsers = this.findPotentialMatches(user, allUsers);

      // Tính toán preferences
      await this.calculateAndSavePreferences([user], filteredUsers);

      // Lấy lại người dùng với preferences đã được tính toán
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true, searchSetting: true },
      });

      if (!updatedUser || !updatedUser.preferences[0]) {
        throw new NotFoundException(
          'Không thể tính toán preferences cho người dùng',
        );
      }

      // Cập nhật userPreference
      return this.getUserSuggestionsFromPreference(
        updatedUser,
        updatedUser.preferences[0],
        filteredUsers,
      );
    }

    const filteredUsers = this.findPotentialMatches(user, allUsers);
    return this.getUserSuggestionsFromPreference(
      user,
      userPreference,
      filteredUsers,
    );
  }

  /**
   * Lấy danh sách gợi ý cho người dùng dựa trên preferences của họ
   * @param userId ID của người dùng cần lấy gợi ý
   * @returns Danh sách người dùng được gợi ý kèm theo điểm tương đồng
   */
  async run(userId: string): Promise<UserSuggestion[]> {
    // Kiểm tra người dùng tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, searchSetting: true },
    });

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với ID: ${userId}`,
      );
    }

    const swipedUsers = await this.prisma.swipe.findMany({
      where: {
        swiperId: userId,
      },
      select: {
        targetUserId: true,
      },
    });

    const swipedUserIds = swipedUsers.map((swipe) => swipe.targetUserId);

    // Lấy tất cả người dùng
    const allUsers = await this.prisma.user.findMany({
      include: { preferences: true, searchSetting: true },
      where: {
        id: {
          notIn: [userId, ...swipedUserIds],
        },
      },
    });

    const filteredUsers = this.findPotentialMatches(user, allUsers);
    // Tính toán preferences
    await this.calculateAndSavePreferences([user], filteredUsers);

    // Lấy lại người dùng với preferences đã được tính toán
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, searchSetting: true },
    });

    if (!updatedUser || !updatedUser.preferences[0]) {
      throw new NotFoundException(
        'Không thể tính toán preferences cho người dùng',
      );
    }

    // Cập nhật userPreference
    return this.getUserSuggestionsFromPreference(
      updatedUser,
      updatedUser.preferences[0],
      filteredUsers,
    );
  }

  /**
   * Lấy danh sách gợi ý từ preference đã có
   * @param user Người dùng hiện tại
   * @param preference Preference của người dùng
   * @param allUsers Tất cả người dùng trong hệ thống
   * @returns Danh sách người dùng được gợi ý
   */
  private getUserSuggestionsFromPreference(
    user: User,
    preference: Preference,
    allUsers: User[],
  ): UserSuggestion[] {
    const suggestions: UserSuggestion[] = [];

    // Lấy danh sách userIds từ preferredOrder
    const { preferredOrder, similarityScores } = preference;

    // Tạo map để tra cứu nhanh
    const userMap = new Map<string, User>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Chuyển đổi preferredOrder thành danh sách gợi ý
    for (let i = 0; i < preferredOrder.length; i++) {
      const suggestedUserId = preferredOrder[i];
      const suggestedUser = userMap.get(suggestedUserId);

      if (suggestedUser) {
        // Bỏ qua nếu là chính người dùng đang xem
        if (suggestedUser.id === user.id) continue;

        // Điểm tương đồng
        const similarityScore = similarityScores[i];

        const distance = getDistance(
          user.latitude || 0,
          user.longitude || 0,
          suggestedUser.latitude || 0,
          suggestedUser.longitude || 0,
        );

        // Thêm vào danh sách gợi ý
        suggestions.push({
          id: suggestedUser.id,
          name: suggestedUser.name || '',
          images: suggestedUser.images || [],
          gender: suggestedUser.gender || '',
          similarityScore,
          interests: suggestedUser.interests || [],
          additionalInfo: {
            education: suggestedUser.education || undefined,
            zodiac: suggestedUser.zodiac || undefined,
            communicationStyle: suggestedUser.communicationStyle || undefined,
            loveLanguage: suggestedUser.loveLanguage || undefined,
            pet: suggestedUser.pet?.toString() || undefined,
            alcoholConsumption:
              suggestedUser.alcoholConsumption?.toString() || undefined,
            smoking: suggestedUser.smoking?.toString() || undefined,
            exerciseHabit: suggestedUser.exerciseHabit?.toString() || undefined,
            diet: suggestedUser.diet?.toString() || undefined,
            socialMediaActivity:
              suggestedUser.socialMediaActivity?.toString() || undefined,
            sleepHabit: suggestedUser.sleepHabit?.toString() || undefined,
            lookingFor: suggestedUser.lookingFor || undefined,
            rawProfile: suggestedUser.rawProfile || undefined,
            distance: distance.toFixed(2),
          },
        });
      }
    }

    return suggestions.sort((a, b) => a.similarityScore - b.similarityScore);
  }

  async getUserSuggestionsByInterest(
    userId: string,
    interestId: string,
  ): Promise<UserSuggestion[]> {
    try {
      // Find the current user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true, searchSetting: true },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const interests = INTERESTS_ARRAY[interestId];

      // Get users that already have been swiped
      const swipedUsers = await this.prisma.swipe.findMany({
        where: {
          swiperId: userId,
        },
        select: {
          targetUserId: true,
        },
      });

      const swipedUserIds = swipedUsers.map((swipe) => swipe.targetUserId);

      // Find users with the specified interest
      const usersWithInterest = await this.prisma.user.findMany({
        where: {
          id: {
            notIn: [userId, ...swipedUserIds], // Exclude current user and swiped users
          },
        },
        include: { preferences: true, searchSetting: true },
      });

      // Apply search settings filters if available

      const filteredUsersByInterests = this.filterByInterests(
        interests,
        usersWithInterest,
      );

      const filteredUsers = this.findPotentialMatches(
        user,
        filteredUsersByInterests,
      );

      const suggestions: UserSuggestion[] = [];
      // Generate suggestions from filtered users
      for (const suggestedUser of filteredUsers) {
        // Calculate similarity score based on common interests
        const userInterests = new Set(user.interests || []);
        const suggestedUserInterests = new Set(suggestedUser.interests || []);
        const commonInterests = [...userInterests].filter((interest) =>
          suggestedUserInterests.has(interest),
        );

        // Simple similarity calculation: percentage of interests in common
        const similarityScore =
          (commonInterests.length /
            Math.max(
              1,
              Math.max(userInterests.size, suggestedUserInterests.size),
            )) *
          100;

        // Calculate distance between users
        const distance = getDistance(
          user.latitude || 0,
          user.longitude || 0,
          suggestedUser.latitude || 0,
          suggestedUser.longitude || 0,
        );

        // Add to suggestions list
        suggestions.push({
          id: suggestedUser.id,
          name: suggestedUser.name || '',
          images: suggestedUser.images || [],
          gender: suggestedUser.gender || '',
          similarityScore,
          interests: suggestedUser.interests || [],
          additionalInfo: {
            education: suggestedUser.education || undefined,
            zodiac: suggestedUser.zodiac || undefined,
            communicationStyle: suggestedUser.communicationStyle || undefined,
            loveLanguage: suggestedUser.loveLanguage || undefined,
            pet: suggestedUser.pet?.toString() || undefined,
            alcoholConsumption:
              suggestedUser.alcoholConsumption?.toString() || undefined,
            smoking: suggestedUser.smoking?.toString() || undefined,
            exerciseHabit: suggestedUser.exerciseHabit?.toString() || undefined,
            diet: suggestedUser.diet?.toString() || undefined,
            socialMediaActivity:
              suggestedUser.socialMediaActivity?.toString() || undefined,
            sleepHabit: suggestedUser.sleepHabit?.toString() || undefined,
            lookingFor: suggestedUser.lookingFor || undefined,
            rawProfile: suggestedUser.rawProfile || undefined,
            distance: distance.toFixed(2),
          },
        });
      }

      // Sap xep tu thap den cao ==> stack thi diem cao se o tren
      return suggestions.sort((a, b) => a.similarityScore - b.similarityScore);
    } catch (err: any) {
      console.log(err);
      return [];
    }
  }

  private filterByInterests(
    interests: string[],
    potentialMatches: User[],
  ): User[] {
    return potentialMatches.filter((match) => {
      return (
        match.interests.some((interest) => interests?.includes(interest)) ||
        interests.includes(match?.lookingFor || '') ||
        interests.includes(match?.socialMediaActivity || '') ||
        interests.includes(match?.alcoholConsumption || '') ||
        interests.includes(match?.smoking || '') ||
        interests.includes(match?.exerciseHabit || '') ||
        interests.includes(match?.diet || '') ||
        interests.includes(match?.sleepHabit || '') ||
        interests.includes(match?.communicationStyle || '') ||
        interests.includes(match?.loveLanguage || '') ||
        interests.includes(match?.pet || '') ||
        interests.includes(match?.education || '') ||
        interests.includes(match?.zodiac || '')
      );
    });
  }
}
