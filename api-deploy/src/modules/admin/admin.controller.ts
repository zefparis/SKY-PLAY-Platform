import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  GetUsersQueryDto,
  UpdateUserDto,
  BanUserDto,
  AdjustWalletDto,
  ForceResultDto,
  CancelChallengeDto,
  GetStatsQueryDto,
  GetTransactionsQueryDto,
  GetLogsQueryDto,
  ResolveDisputeDto,
  AddTestCreditsDto,
  DistributeTestCreditsDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtDualGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/chart')
  async getChartData(@Query() query: GetStatsQueryDto) {
    return this.adminService.getChartData(query);
  }

  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.adminService.updateUser(id, dto, req.user.id);
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Body() dto: BanUserDto, @Request() req) {
    return this.adminService.banUser(id, dto, req.user.id);
  }

  @Post('users/:id/unban')
  async unbanUser(@Param('id') id: string, @Request() req) {
    return this.adminService.unbanUser(id, req.user.id);
  }

  @Post('users/:id/verify')
  async verifyUser(@Param('id') id: string, @Request() req) {
    return this.adminService.verifyUser(id, req.user.id);
  }

  @Get('challenges')
  async getChallenges(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getChallenges(status, type, page, limit);
  }

  @Get('challenges/:id')
  async getChallengeById(@Param('id') id: string) {
    return this.adminService.getChallengeById(id);
  }

  @Post('challenges/:id/cancel')
  async cancelChallenge(@Param('id') id: string, @Body() dto: CancelChallengeDto, @Request() req) {
    return this.adminService.cancelChallenge(id, dto, req.user.id);
  }

  @Post('challenges/:id/force-result')
  async forceResult(@Param('id') id: string, @Body() dto: ForceResultDto, @Request() req) {
    return this.adminService.forceResult(id, dto, req.user.id);
  }

  @Get('challenges/disputes')
  async getDisputes(@Query('status') status?: string) {
    return this.adminService.getDisputes(status);
  }

  @Get('challenges/disputes/:id')
  async getDisputeById(@Param('id') id: string) {
    return this.adminService.getDisputeById(id);
  }

  @Post('challenges/disputes/:id/resolve')
  async resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Request() req) {
    return this.adminService.resolveDispute(id, dto, req.user.id);
  }

  @Get('wallet/transactions')
  async getTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.adminService.getTransactions(query);
  }

  @Post('wallet/adjust')
  async adjustWallet(@Body() dto: AdjustWalletDto, @Request() req) {
    return this.adminService.adjustWallet(dto, req.user.id);
  }

  @Post('wallet/refund/:transactionId')
  async refundTransaction(@Param('transactionId') transactionId: string, @Request() req) {
    return this.adminService.refundTransaction(transactionId, req.user.id);
  }

  @Get('wallet/platform-stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('logs')
  async getLogs(@Query() query: GetLogsQueryDto) {
    return this.adminService.getLogs(query);
  }

  // ─── TEST CREDITS ──────────────────────────────────────────────────────────

  @Post('wallet/add-test-credits')
  async addTestCredits(@Body() dto: AddTestCreditsDto, @Request() req) {
    return this.adminService.addTestCredits(dto, req.user.id);
  }

  @Get('wallet/test-credits-stats')
  async getTestCreditsStats() {
    return this.adminService.getTestCreditsStats();
  }

  @Post('wallet/distribute-test-credits')
  async distributeTestCredits(@Body() dto: DistributeTestCreditsDto, @Request() req) {
    return this.adminService.distributeTestCredits(dto, req.user.id);
  }

  @Get('wallet/recent-users')
  async getRecentUsersForTest() {
    return this.adminService.getRecentUsersForTest(10);
  }
}
