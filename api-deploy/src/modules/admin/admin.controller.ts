import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ChallengesService } from '../challenges/challenges.service';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly challengesService: ChallengesService,
  ) {}

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

  // NOTE: must be declared BEFORE `challenges/:id` so the literal segments
  // don't get captured by the dynamic `:id` route.
  @Get('challenges/winnings/pending')
  async getPendingWinnings() {
    return this.challengesService.getWinningsPending();
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

  // ─── KYC ──────────────────────────────────────────────────────────

  @Get('users/kyc-pending')
  async getKycPending() {
    return this.adminService.getKycPending();
  }

  @Post('users/:id/kyc/verify')
  async verifyKyc(@Param('id') id: string, @Request() req) {
    return this.adminService.verifyKyc(id, req.user.id);
  }

  @Post('users/:id/kyc/reject')
  async rejectKyc(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.adminService.rejectKyc(id, body.reason, req.user.id);
  }

  // ─── EXCLUSION ──────────────────────────────────────────────────────

  @Get('exclusions')
  async getExcludedUsers() {
    return this.adminService.getExcludedUsers();
  }

  @Post('users/:id/exclude')
  async excludeUser(@Param('id') id: string, @Body() body: { duration: string; reason: string }, @Request() req) {
    return this.adminService.adminExcludeUser(id, body, req.user.id);
  }

  @Post('users/:id/reactivate')
  async reactivateUser(@Param('id') id: string, @Body() body: { justification: string }, @Request() req) {
    return this.adminService.adminReactivateUser(id, body.justification, req.user.id);
  }

  // ─── SÉCURITÉ / DEVICE FINGERPRINT ──────────────────────────────────────────

  @Get('security/alerts')
  async getSecurityAlerts() {
    return this.adminService.getSecurityAlerts();
  }

  @Get('security/devices/flagged')
  async getFlaggedDevices() {
    return this.adminService.getFlaggedDevices();
  }

  @Get('security/stats')
  async getDeviceStats() {
    return this.adminService.getDeviceStats();
  }

  @Get('users/:id/devices')
  async getUserDevices(@Param('id') id: string) {
    return this.adminService.getUserDevices(id);
  }

  @Post('security/devices/:id/unflag')
  async unflagDevice(@Param('id') id: string, @Request() req) {
    return this.adminService.unflagDevice(id, req.user.id);
  }

  @Post('security/fingerprint/:fingerprint/ban-all')
  async banAllLinkedAccounts(@Param('fingerprint') fingerprint: string, @Request() req) {
    return this.adminService.banAllLinkedAccounts(fingerprint, req.user.id);
  }
}
