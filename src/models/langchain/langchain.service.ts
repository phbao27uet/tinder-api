import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
@Injectable()
export class LangChainService {
  private vectorStore: MongoDBAtlasVectorSearch;
  private gemini: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.gemini = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY') || '',
    );
    this.initEmbeddingModel();
    this.initVectorStore();
  }

  private initVectorStore() {
    this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddingModel, {
      collection: this.prisma.user as any,
      indexName: 'vector_index',
      textKey: 'rawProfile',
    });
  }

  private async initEmbeddingModel() {
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const { pipeline } = await TransformersApi;

    this.embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );
  }

  async getRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Tìm kiếm semantic
    const results = await this.vectorStore.similaritySearchVectorWithScore(
      user.embeddings,
      10,
      {
        preFilters: {
          age: { $gte: Number(user.age) - 5, $lte: Number(user.age) + 5 },
        },
      },
    );

    // RAG: Kết hợp kết quả với Gemini
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
      Generate match suggestions based on these profiles:
      ${results.map((r) => r[0].pageContent).join('\n')}
      
      User preferences:
      - Interests: ${user.interests}
      - Job: ${user.job}
    `;

    const response = await model.generateContent(prompt);
    return response.response.text();
  }
}
