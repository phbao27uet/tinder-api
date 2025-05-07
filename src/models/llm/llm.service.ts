// llm.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SignUpDto } from '@models/auth/dto/sign-up.dto';
import {
  ALCOHOL_CONSUMPTION,
  COMMUNICATION_STYLE,
  DIETARY_PREFERENCE,
  EDUCATION,
  EXERCISE_FREQUENCY,
  FUTURE_FAMILY,
  GENDER,
  LOOKING_FOR,
  LOVE_LANGUAGE,
  PETS,
  SLEEP_PATTERN,
  SMOKING_PREFERENCE,
  SOCIAL_MEDIA_USAGE,
  ZODIAC_SIGN,
} from '@shared/utils';
import { User } from '@prisma/client';

export interface IUserMatch {
  _id: {
    $oid: string;
  };
  email: string;
  images: string[];
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  // preferredDistance: number;
  rawProfile: string;
  interests: string[]; // Có thể tạo enum nếu bạn cần giới hạn giá trị
  embeddings: number[];
  lookingFor: string; // Có thể tạo enum nếu cần
  languages: string[];
  zodiac: string;
  education: string;
  communicationStyle: string;
  loveLanguage: string;
  pet: string;
  alcoholConsumption: string;
  smoking: string;
  exerciseHabit: string;
  diet: string;
  socialMediaActivity: string;
  sleepHabit: string;
}

@Injectable()
export class LlmService {
  private embeddingModel: any;
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Khởi tạo model embedding khi service được tạo
    this.initEmbeddingModel();
  }

  private gemini = new GoogleGenerativeAI(
    this.configService.get('GEMINI_API_KEY') || '',
  );

  private async initEmbeddingModel() {
    try {
      const TransformersApi = Function(
        'return import("@xenova/transformers")',
      )();
      const { pipeline } = await TransformersApi;

      // Use all-MiniLM-L6-v2 which produces 384-dimensional embeddings
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          revision: 'main',
          quantized: false,
        },
      );
      this.logger.log('Embedding model initialized successfully');
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize embedding model: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not initialize embedding model',
      );
    }
  }

  async processUserData(_formData: SignUpDto) {
    try {
      const formData = { ..._formData };

      // Bước 1: Xử lý với Gemini để trích xuất các thông tin từ Bio
      const dynamicPrompt = this.createDynamicPrompt(formData.rawProfile);
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(dynamicPrompt);
      const text = result.response.text();
      const json = this.parseGeminiResponse(text);

      // Bước 2: Tạo combined text trực tiếp từ form data
      formData.interests = [...(formData?.interests || []), ...json.interests];
      const combinedText = this.createCombinedText(formData);

      // Bước 3: Tạo embedding từ combined text
      const embeddings = await this.embeddingModel(combinedText, {
        pooling: 'mean',
        normalize: true,
      });

      // Ensure we're getting a flat array of numbers that matches the 384 dimensions
      // specified in the MongoDB config
      const embeddingArray = Array.from(embeddings.data);

      // Validate embedding dimensions
      if (embeddingArray.length !== 384) {
        this.logger.error(
          `Expected 384 dimensions but got ${embeddingArray.length}`,
        );
        throw new InternalServerErrorException('Invalid embedding dimensions');
      }

      return {
        embeddings: embeddingArray as number[],
        text: combinedText,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi xử lý dữ liệu: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Lỗi xử lý dữ liệu người dùng');
    }
  }

  private createCombinedText(formData: SignUpDto): string {
    return `
    **Thông tin cơ bản**:
    - Tên: ${formData.name || 'Chưa cung cấp'}
    - Ngày sinh: ${formData.birthday || 'Chưa cung cấp'}
    - Giới tính: ${formData.gender ? GENDER[formData.gender] : 'Chưa cung cấp'}
    - Mục tiêu: ${formData.lookingFor ? LOOKING_FOR[formData.lookingFor] : 'Chưa xác định'}
    
    **Sở thích**:
    ${formData.interests?.join(', ') || 'Không có'}
    
    **Ngôn ngữ**:
    ${formData.languages?.join(', ') || 'Không có'}
    
    **Cung hoàng đạo**:
    ${formData.zodiacSign ? ZODIAC_SIGN[formData.zodiacSign] : 'Chưa xác định'}
    
    **Học vấn**:
    ${formData.education ? EDUCATION[formData.education] : 'Chưa cung cấp'}
    
    **Kế hoạch gia đình**:
    ${formData.futureFamily ? FUTURE_FAMILY[formData.futureFamily] : 'Chưa xác định'}
    
    **Phong cách giao tiếp**:
    ${formData.communicationStyle ? COMMUNICATION_STYLE[formData.communicationStyle] : 'Chưa xác định'}
    
    **Ngôn ngữ tình yêu**:
    ${formData.loveLanguage ? LOVE_LANGUAGE[formData.loveLanguage] : 'Chưa xác định'}
    
    **Thú cưng**:
    ${formData.pet ? PETS[formData.pet] : 'Không có'}
    
    **Rượu bia**:
    ${formData.alcoholConsumption ? ALCOHOL_CONSUMPTION[formData.alcoholConsumption] : 'Chưa xác định'}
    
    **Hút thuốc**:
    ${formData.smoking ? SMOKING_PREFERENCE[formData.smoking] : 'Chưa xác định'}
    
    **Tập luyện**:
    ${formData.exerciseHabit ? EXERCISE_FREQUENCY[formData.exerciseHabit] : 'Chưa xác định'}
    
    **Chế độ ăn**:
    ${formData.diet ? DIETARY_PREFERENCE[formData.diet] : 'Chưa xác định'}
    
    **Hoạt động MXH**:
    ${formData.socialMediaActivity ? SOCIAL_MEDIA_USAGE[formData.socialMediaActivity] : 'Chưa xác định'}
    
    **Thói quen ngủ**:
    ${formData.sleepHabit ? SLEEP_PATTERN[formData.sleepHabit] : 'Chưa xác định'}
    `;
  }

  private createDynamicPrompt(rawProfile: string): string {
    return `
      Trích xuất JSON gồm: interests[] từ: "${rawProfile}"
    `;
  }

  private parseGeminiResponse(responseText: string): any {
    try {
      const cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanText);
    } catch (err: any) {
      this.logger.error('Lỗi phân tích phản hồi từ Gemini', err.stack);
      throw new InternalServerErrorException('Lỗi xử lý dữ liệu AI');
    }
  }

  /**
   * Phân tích mức độ tương thích giữa userProfile và các matches sử dụng Gemini API
   * và chuẩn bị dữ liệu cho thuật toán Gale-Shapley
   */
  async analyzeMatchesWithAI(userProfile: User, matches: IUserMatch[]) {
    try {
      // Kiểm tra embedding của userProfile
      if (!userProfile.embeddings || userProfile.embeddings.length !== 384) {
        throw new InternalServerErrorException(
          'User profile chưa có embeddings hợp lệ',
        );
      }

      // Lọc các matches có embedding hợp lệ
      const validMatches = matches.filter(
        (m) => Array.isArray(m.embeddings) && m.embeddings.length === 384,
      );
      if (validMatches.length === 0) {
        throw new InternalServerErrorException(
          'Không có matches nào có embeddings hợp lệ',
        );
      }

      // Bước 1: Tính base compatibility scores dựa trên cosine similarity
      const baseResults = validMatches.map((m) => {
        const score = this.cosineSimilarity(
          userProfile.embeddings,
          m.embeddings,
        );

        return {
          match: m,
          matchId: m._id.$oid,
          compatibilityScore: score,
        };
      });

      // Bước 2: Sử dụng Gemini để phân tích sâu hơn về tương thích
      const enhancedResults = await this.enhanceMatchesWithGemini(
        userProfile,
        baseResults,
      );

      // Bước 3: Tổng hợp kết quả từ cả embedding và Gemini
      const finalResults = this.combineResults(baseResults, enhancedResults);

      // Bước 4: Chuẩn hóa output cho Gale-Shapley
      const preferredOrder = finalResults.map((r) => r.matchId);
      const similarityScores = finalResults.map((r) => r.compatibilityScore);

      return {
        preferredOrder,
        similarityScores,
        details: finalResults, // Thông tin chi tiết bao gồm cả lý do
      };
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi phân tích matches với AI: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Lỗi khi phân tích matches với AI',
      );
    }
  }

  /**
   * Hàm tính cosine similarity giữa hai vector embedding
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((acc, val) => acc + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((acc, val) => acc + val ** 2, 0));
    if (normA === 0 || normB === 0) return 0;
    // Chuẩn hóa về [0, 1] thay vì [-1, 1]
    return (dot / (normA * normB) + 1) / 2;
  }

  /**
   * Tạo chuỗi biểu diễn người dùng dưới dạng text để phân tích
   */
  private createUserMatchText(user: IUserMatch): string {
    return `
      User ID: ${user._id.$oid}
      Name: ${user.name || 'Unknown'}
      Gender: ${user.gender || 'Unknown'}
      Raw Profile: ${user.rawProfile || ''}
      Interests: ${user.interests?.join(', ') || ''}
      Zodiac: ${user.zodiac || 'Unknown'}
      Education: ${user.education || 'Unknown'}
      Communication Style: ${user.communicationStyle || 'Unknown'}
      Love Language: ${user.loveLanguage || 'Unknown'}
      Pets: ${user.pet || 'Unknown'}
      Alcohol Consumption: ${user.alcoholConsumption || 'Unknown'}
      Smoking: ${user.smoking || 'Unknown'}
      Exercise Habits: ${user.exerciseHabit || 'Unknown'}
      Diet: ${user.diet || 'Unknown'}
      Social Media Activity: ${user.socialMediaActivity || 'Unknown'}
      Sleep Habits: ${user.sleepHabit || 'Unknown'}
      Looking For: ${user.lookingFor || 'Unknown'}
    `;
  }

  private createUserText(user: User): string {
    return `
      User ID: ${user.id}
      Name: ${user.name || 'Unknown'}
      Gender: ${user.gender || 'Unknown'}
      Raw Profile: ${user.rawProfile || ''}
      Interests: ${user.interests?.join(', ') || ''}
      Zodiac: ${user.zodiac || 'Unknown'}
      Education: ${user.education || 'Unknown'}
      Communication Style: ${user.communicationStyle || 'Unknown'}
      Love Language: ${user.loveLanguage || 'Unknown'}
      Pets: ${user.pet || 'Unknown'}
      Alcohol Consumption: ${user.alcoholConsumption || 'Unknown'}
      Smoking: ${user.smoking || 'Unknown'}
      Exercise Habits: ${user.exerciseHabit || 'Unknown'}
      Diet: ${user.diet || 'Unknown'}
      Social Media Activity: ${user.socialMediaActivity || 'Unknown'}
      Sleep Habits: ${user.sleepHabit || 'Unknown'}
      Looking For: ${user.lookingFor || 'Unknown'}
    `;
  }

  /**
   * Sử dụng Gemini để phân tích sâu hơn về tương thích giữa userProfile và matches
   */
  private async enhanceMatchesWithGemini(
    userProfile: User,
    baseResults: Array<{
      match: IUserMatch;
      matchId: string;
      compatibilityScore: number;
    }>,
  ) {
    // Khởi tạo Gemini model
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Tạo thông tin người dùng dưới dạng text cho từng match
    const userProfileText = this.createUserText(userProfile);
    const matchEntries = baseResults.map(({ match, matchId }, idx) => {
      const matchProfileText = this.createUserMatchText(match);
      return `Match ${idx + 1} (matchId: ${matchId}):\nTHÔNG TIN NGƯỜI DÙNG 1:\n${userProfileText}\nTHÔNG TIN NGƯỜI DÙNG 2:\n${matchProfileText}`;
    });

    // Xây dựng prompt tổng hợp
    const prompt = `
Bạn là chuyên gia phân tích tâm lý và tương thích giữa hai người. Dưới đây là danh sách các cặp cần phân tích:

${matchEntries.join('\n\n')}

Hãy phân tích mức độ tương thích của từng cặp theo các tiêu chí:
1. Sở thích và hoạt động chung
2. Giá trị sống và mục tiêu tương lai
3. Thói quen và lối sống
4. Phong cách giao tiếp và ngôn ngữ tình yêu

Trả về kết quả dưới dạng một MẢNG JSON, mỗi phần tử ứng với từng Match theo đúng thứ tự, với format:
[
  {
    "compatibilityScore": <số từ 0 đến 1, càng gần 1 càng tương thích>,
    "reasons": ["lý do 1", "lý do 2", "lý do 3"],
    "incompatibilities": ["điểm không tương thích 1", "điểm không tương thích 2"]
  },
  ...
]
Chỉ trả về mảng JSON, không thêm bất kỳ văn bản nào khác.
`;

    try {
      // Gọi Gemini cho cả batch
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Làm sạch response để đảm bảo có thể parse được
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      let analysisResults: any[] = [];
      try {
        analysisResults = JSON.parse(cleanText);
        if (!Array.isArray(analysisResults))
          throw new Error('Gemini không trả về mảng JSON');
      } catch (error: any) {
        this.logger.warn(
          `Không thể phân tích kết quả JSON từ Gemini cho batch: ${error.message}`,
        );
        // fallback: trả về default cho tất cả
        return baseResults.map(({ matchId }) => ({
          matchId,
          compatibilityScore: 0.5,
          reasons: ['Không thể phân tích chi tiết từ Gemini'],
          incompatibilities: [],
        }));
      }

      console.log(analysisResults);

      // Map lại kết quả với matchId tương ứng
      return baseResults.map(({ matchId }, idx) => {
        const analysis = analysisResults[idx] || {};

        console.log('index', idx, analysis);

        return {
          matchId,
          compatibilityScore: analysis.compatibilityScore ?? 0.5,
          reasons: analysis.reasons ?? [],
          incompatibilities: analysis.incompatibilities ?? [],
        };
      });
    } catch (error: any) {
      this.logger.warn(`Lỗi khi gọi Gemini cho batch: ${error.message}`);
      // fallback: trả về default cho tất cả
      return baseResults.map(({ matchId }) => ({
        matchId,
        compatibilityScore: 0.5,
        reasons: ['Không thể kết nối với Gemini'],
        incompatibilities: [],
      }));
    }
  }

  /**
   * Kết hợp kết quả từ phân tích embedding và Gemini
   */
  private combineResults(
    baseResults: Array<{
      match: IUserMatch;
      matchId: string;
      compatibilityScore: number;
    }>,
    enhancedResults: Array<{
      matchId: string;
      compatibilityScore: number;
      reasons: string[];
      incompatibilities: string[];
    }>,
  ) {
    // Tạo map để dễ truy xuất enhancedResults
    const enhancedMap = new Map(
      enhancedResults.map((result) => [result.matchId, result]),
    );

    // Kết hợp kết quả
    const combinedResults = baseResults.map(
      ({ match, matchId, compatibilityScore }) => {
        const enhanced = enhancedMap.get(matchId);

        // Nếu có kết quả từ Gemini, kết hợp với kết quả từ embedding
        if (enhanced) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { embeddings, ...matchRest } = match;

          // Tính điểm trung bình giữa embedding và Gemini (có thể điều chỉnh trọng số)
          const weightEmbedding = 0.4; // Trọng số cho phương pháp embedding
          const weightGemini = 0.6; // Trọng số cho phân tích của Gemini
          const combinedScore =
            compatibilityScore * weightEmbedding +
            enhanced.compatibilityScore * weightGemini;

          return {
            match: matchRest,
            matchId,
            compatibilityScore: combinedScore,
            reasons: enhanced.reasons,
            incompatibilities: enhanced.incompatibilities,
          };
        }

        // Nếu không có kết quả từ Gemini, giữ nguyên kết quả từ embedding
        return {
          match,
          matchId,
          compatibilityScore,
          reasons: [
            `Điểm tương đồng dựa trên vector embedding: ${compatibilityScore.toFixed(3)}`,
          ],
          incompatibilities: [],
        };
      },
    );

    // Sắp xếp theo compatibilityScore giảm dần
    combinedResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return combinedResults;
  }
}
