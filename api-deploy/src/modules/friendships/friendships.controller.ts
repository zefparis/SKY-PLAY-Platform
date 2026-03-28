import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private friendshipsService: FriendshipsService) {}

  @Post('request/:userId')
  async sendRequest(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.sendFriendRequest(req.user.id, userId);
  }

  @Post('accept/:userId')
  async acceptRequest(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.acceptFriendRequest(req.user.id, userId);
  }

  @Post('decline/:userId')
  async declineRequest(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.declineFriendRequest(req.user.id, userId);
  }

  @Delete(':userId')
  async removeFriend(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.removeFriend(req.user.id, userId);
  }

  @Post('block/:userId')
  async blockUser(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.blockUser(req.user.id, userId);
  }

  @Delete('block/:userId')
  async unblockUser(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.unblockUser(req.user.id, userId);
  }

  @Get()
  async getFriends(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.friendshipsService.getFriends(req.user.id, limit, offset);
  }

  @Get('pending')
  async getPendingRequests(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.friendshipsService.getPendingRequests(req.user.id, limit, offset);
  }

  @Get('suggestions')
  async getSuggestions(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.friendshipsService.getSuggestions(req.user.id, limit);
  }

  @Get('status/:userId')
  async getFriendshipStatus(@Request() req, @Param('userId') userId: string) {
    return this.friendshipsService.getFriendshipStatus(req.user.id, userId);
  }
}
