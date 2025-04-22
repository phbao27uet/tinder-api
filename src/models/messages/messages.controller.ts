import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Auth, GetCurrentUserId } from '@shared/decorators';
import { StartConversationDto } from './dto/start-conversation.dto';

@Controller('messages')
@Auth('USER')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  sendMessage(@Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(dto);
  }

  @Get('mine-conversations')
  getAllConversations(@GetCurrentUserId() userId: string): Promise<any> {
    return this.messagesService.getAllConversations(userId);
  }

  @Post('start-conversation')
  startConversation(
    @Body() dto: StartConversationDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.messagesService.startConversation(userId, dto);
  }

  @Get('conversation')
  getConversation(
    @Query('userId') userId: string,
    @Query('otherUserId') otherUserId: string,
  ) {
    return this.messagesService.getConversation(userId, otherUserId);
  }

  @Get('unread-count')
  getUnreadCount(@Query('userId') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(id);
  }

  @Patch('mark-all-as-read')
  markAllAsRead(
    @Query('currentUserId') currentUserId: string,
    @Query('otherUserId') otherUserId: string,
  ) {
    return this.messagesService.markAllAsRead(currentUserId, otherUserId);
  }
}
