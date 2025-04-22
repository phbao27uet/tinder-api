export class CreateMessageDto {
  senderId: string;
  receiverId: string;
  matchId?: string;
  content: string;
}
