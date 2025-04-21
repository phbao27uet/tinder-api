/* eslint-disable prettier/prettier */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

@Injectable()
export class LangChainService {
  private gemini: GoogleGenerativeAI;
  private embeddingModel: any;
  private generalModel: any;
  private textSplitter: RecursiveCharacterTextSplitter;
  private readonly logger = new Logger(LangChainService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.gemini = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY') || '',
    );
    this.initEmbeddingModel();
    this.initTextSplitter();
  }

  private initTextSplitter() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  private async initEmbeddingModel() {
    try {
      const TransformersApi = Function(
        'return import("@xenova/transformers")',
      )();
      const { pipeline } = await TransformersApi;

      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );

      // Updated to use the correct model name for the latest API version
      this.generalModel = this.gemini.getGenerativeModel({
        model: 'gemini-1.0-pro',
      });
      this.logger.log('LangChain models initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize LangChain models', error);
      throw new Error('Failed to initialize LangChain models');
    }
  }

  /**
   * Get match recommendations based on semantic similarity
   */
  async getRecommendations(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create a profile summary for the user
      const userProfile = this.createUserProfileSummary(user);

      // Get similar profiles using direct MongoDB query
      const similarProfiles = await this.getSimilarProfiles(userId, 5);

      if (similarProfiles.length === 0) {
        return "No matching profiles found. Please complete your profile to receive better matches.";
      }

      // Format similar profiles for LLM processing
      const profilesText = similarProfiles.map(profile =>
        `Profile: ${profile.name || 'Anonymous'}
         Interests: ${profile.interests ? profile.interests.join(', ') : 'Not specified'}
         Bio: ${profile.rawProfile || 'No profile information'}
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
         Similarity Score: ${Math.round(profile.score * 100)}%
        `
      ).join('\n\n');

      try {
        // Create a prompt with the user profile and similar profiles
        const prompt = `
          You are a dating app matching algorithm specialist.
          Analyze these profiles and generate personalized matching recommendations for the user.
          
          User profile:
          ${userProfile}
          
          Similar profiles:
          ${profilesText}
          
          Based on the above information, generate match recommendations highlighting:
          1. Compatibility factors between the user and each profile
          2. Shared interests and potential conversation topics
          3. Why these matches might be good for the user
          
          Format your response as a well-structured analysis with clear sections for each match.
        `;

        const response = await this.generalModel.generateContent(prompt);
        return response.response.text();
      } catch (error) {
        this.logger.error('Error generating content with Gemini', error);

        // Fallback response if Gemini fails
        return `
          Based on similarity analysis, we found ${similarProfiles.length} potential matches for you.
          
          ${similarProfiles.map((profile, index) =>
          `Match ${index + 1}: ${profile.name || 'Anonymous'}
             Compatibility Score: ${Math.round(profile.score * 100)}%
             Shared Interests: ${profile.interests ? profile.interests.filter(i =>
            user.interests?.includes(i)).join(', ') || 'None found' : 'None found'}
            `
        ).join('\n\n')}
          
          Complete your profile to receive better matches!
        `;
      }
    } catch (error) {
      this.logger.error('Error getting recommendations', error);
      throw new Error('Failed to get recommendations: ' + (error as Error).message);
    }
  }

  /**
   * Generate similarity-based matches without using LLM
   */
  async getSimilarProfiles(userId: string, limit = 10) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.embeddings || !Array.isArray(user.embeddings)) {
        this.logger.warn(`User ${userId} doesn't have valid embeddings`);
        return [];
      }

      // Use direct MongoDB aggregation without the vector search index if not available
      try {
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
              _id: { $ne: user.id },
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
              // embeddings: 1,
              birthday: 1,
              interests: 1,
              languages: 1,
              updatedAt: 1,
              createdAt: 1,
              address: 1,
              lat: 1,
              lng: 1,
              distance: 1,
              zodiacSign: 1,
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
            },
          },
        ];

        const result = await this.prisma.user.aggregateRaw({
          pipeline,
          options: {
            cursor: { batchSize: 100 },
          },
        });

        if (result && (result as any).cursor && (result as any).cursor.firstBatch) {
          const profiles = (result as any).cursor.firstBatch.map((user: any) => ({
            userId: user.id,
            score: user.score,
            profile: user.rawProfile || 'No profile information',
            name: user.name,
            interests: user.interests,
          }));

          return profiles;
        }
      } catch (e) {
        this.logger.warn('Vector search failed, falling back to basic query', e);
      }

      // Fallback: Basic query without vector search
      const allUsers = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
          gender: user.gender === 'MALE' ? 'FEMALE' : 'MALE',
        },
        select: {
          id: true,
          name: true,
          rawProfile: true,
          interests: true,
          gender: true,
        },
        take: limit,
      });

      return allUsers.map(otherUser => {
        // Calculate basic similarity based on shared interests
        const sharedInterests = user.interests?.filter(i =>
          otherUser.interests?.includes(i));
        const score = sharedInterests?.length ?
          sharedInterests.length / Math.max(user.interests?.length || 1, otherUser.interests?.length || 1) :
          0.1; // Give a minimal score for users with no interests

        return {
          userId: otherUser.id,
          score,
          profile: otherUser.rawProfile || 'No profile information',
          name: otherUser.name,
          interests: otherUser.interests,
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('Error finding similar profiles', error);
      // Fallback to returning empty array if all methods fail
      return [];
    }
  }

  /**
   * Create a detailed profile summary for processing
   */
  private createUserProfileSummary(user: any): string {
    const preferences =
      user.preferences && user.preferences.length > 0
        ? user.preferences[0]
        : null;

    return `
      User ID: ${user.id}
      Name: ${user.name || 'Anonymous'}
      Age: ${user.age || 'Not specified'}
      Gender: ${user.gender || 'Not specified'}
      Looking for: ${user.lookingFor || 'Not specified'}
      
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
      
      Interests: ${user.interests ? user.interests.join(', ') : 'Not specified'}
      Languages: ${user.languages ? user.languages.join(', ') : 'Not specified'}
      
      Bio: ${user.rawProfile || 'Not provided'}
      
      Preferences: ${preferences
        ? `Priority factors: ${preferences.priorityFactors ? preferences.priorityFactors.join(', ') : 'None specified'}`
        : 'No preference data available'
      }
    `;
  }

  /**
   * Index a user profile in the database
   */
  async indexUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.embeddings) {
      throw new Error('User not found or embeddings missing');
    }

    // Update the last indexed timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastIndexed: new Date(),
      },
    });

    return { success: true, message: 'User profile indexed successfully' };
  }
}
