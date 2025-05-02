import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { PrismaService } from '@shared/prisma';
import { Message } from '@prisma/client';

interface UserInfo {
  id: string;
  name: string | null;
  images: string[];
}

interface ConversationInfo {
  otherUser: UserInfo;
  latestMessage: Message & {
    sender: UserInfo;
    receiver: UserInfo;
  };
  unreadCount: number;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) { }

  async sendMessage(dto: CreateMessageDto) {
    return this.prisma.message.create({ data: dto });
  }

  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getMineConversations(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getAllConversations(userId: string) {
    try {
      // 1. Tìm tất cả những người đã tương tác (gửi/nhận tin nhắn) với người dùng hiện tại
      const interactions = await this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId }, // Tin nhắn người dùng đã gửi
            { receiverId: userId }, // Tin nhắn người dùng đã nhận
          ],
        },
        select: {
          senderId: true,
          receiverId: true,
        },
        distinct: ['senderId', 'receiverId'],
      });

      // 2. Xác định danh sách các userIds mà người dùng đã tương tác
      const interactedUserIds = new Set<string>();
      interactions.forEach((interaction) => {
        if (interaction.senderId !== userId) {
          interactedUserIds.add(interaction.senderId);
        }
        if (interaction.receiverId !== userId) {
          interactedUserIds.add(interaction.receiverId);
        }
      });

      // 3. Lấy thông tin cuộc hội thoại với từng người
      const conversations: ConversationInfo[] = [];

      for (const otherUserId of interactedUserIds) {
        // Lấy tin nhắn mới nhất giữa hai người
        const latestMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { timestamp: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        });

        // Lấy số tin nhắn chưa đọc
        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            read: false,
          },
        });

        // Lấy thông tin người dùng khác
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            name: true,
            images: true,
          },
        });

        if (latestMessage && otherUser) {
          conversations.push({
            otherUser,
            latestMessage,
            unreadCount,
          });
        }
      }

      // 4. Sắp xếp theo thời gian tin nhắn mới nhất
      return conversations.sort(
        (a, b) =>
          b.latestMessage.timestamp.getTime() -
          a.latestMessage.timestamp.getTime(),
      );
    } catch (error) {
      console.error('Lỗi trong quá trình lấy tin nhắn:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, read: false },
    });
  }

  async markAsRead(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string, otherUserId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async startConversation(userId: string, dto: StartConversationDto) {
    console.log(userId, dto);
    // Kiểm tra người nhận có tồn tại không
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Người nhận không tồn tại');
    }

    // Tạo tin nhắn đầu tiên
    const newMessage = await this.prisma.message.create({
      data: {
        senderId: userId,
        receiverId: dto.receiverId,
        matchId: dto.matchId,
        content: dto.content,
        timestamp: new Date(),
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    });

    console.log(newMessage);

    return newMessage;
  }
}
