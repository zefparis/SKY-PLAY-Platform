import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
  NotFoundException,
  Headers,
  Ip,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Response } from 'express';
import PDFDocument = require('pdfkit');
import { ChallengesService } from './challenges.service';
import { ChallengeInviteService } from './challenge-invite.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import {
  CreateChallengeDto,
  SubmitResultDto,
  ForceDisputeDto,
  ResolveDisputeDto,
  CreateInviteDto,
  RespondInviteDto,
} from './dto/challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly inviteService: ChallengeInviteService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('game') game?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.challengesService.findAll({
      status,
      game,
      type,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @UseGuards(JwtDualGuard)
  @Get('my')
  getMyChallenges(@Request() req) {
    return this.challengesService.getMyChallenges(req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Get('invites/pending')
  getPendingInvites(@Request() req) {
    return this.inviteService.getPendingInvites(req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/invite')
  createInvite(
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
    @Request() req,
  ) {
    return this.inviteService.createInvite(req.user.id, id, dto.toUserId);
  }

  @UseGuards(JwtDualGuard)
  @Post('invites/:inviteId/respond')
  respondToInvite(
    @Param('inviteId') inviteId: string,
    @Body() dto: RespondInviteDto,
    @Request() req,
  ) {
    return this.inviteService.respondToInvite(req.user.id, inviteId, dto.accept);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Get(':id/rules.pdf')
  async downloadRulesPdf(@Param('id') id: string, @Res() res: Response) {
    const challenge = await this.challengesService.findOne(id);
    if (!challenge) throw new NotFoundException('Compétition introuvable');

    const TYPE_LABELS: Record<string, string> = {
      DUEL: 'Duel Classé 1v1',
      SMALL_CHALLENGE: 'Petit Challenge',
      STANDARD: 'Challenge Standard',
      MEDIUM_TOURNAMENT: 'Tournoi Moyen',
      BIG_TOURNAMENT: 'Grand Tournoi',
      PREMIUM_TOURNAMENT: 'Tournoi Premium',
    };

    const entryFee: number = Number(challenge.entryFee);
    const potTotal: number = Number(challenge.potTotal);
    const commission: number = Number(challenge.commission);
    const orgFee = Math.round(commission * 100);
    const netPot = potTotal * (1 - commission);
    const prizeFirst = Math.floor(netPot * 0.5);
    const typeLabel = TYPE_LABELS[challenge.type] ?? challenge.type;
    const formatCFA = (n: number) =>
      new Intl.NumberFormat('fr-FR').format(Math.round(n)) + '\u00a0CFA';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `reglement-${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ─── Header ───────────────────────────────────────────────────────────────
    doc
      .fillColor('#0097FC')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('SKY PLAY ENTERTAINMENT', { align: 'center' });

    doc
      .fillColor('#333333')
      .fontSize(10)
      .font('Helvetica')
      .text('Plateforme de compétitions e-sport fondées sur l\'habileté — Cameroun', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#0097FC')
      .lineWidth(2)
      .stroke();
    doc.moveDown(0.8);

    // ─── Title ────────────────────────────────────────────────────────────────
    doc
      .fillColor('#111111')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('RÈGLEMENT OFFICIEL', { align: 'center' });

    doc
      .fillColor('#333333')
      .fontSize(13)
      .font('Helvetica')
      .text(challenge.title, { align: 'center' });

    doc.moveDown(0.4);
    const rulesVersion = 'v1.0';
    const rulesContent = `${challenge.title}-${challenge.type}-${challenge.entryFee}-${challenge.maxPlayers}-${challenge.commission}-${dateStr}`;
    const rulesHash = crypto.createHash('sha256').update(rulesContent).digest('hex');
    const hashShort = rulesHash.slice(0, 12);

    doc
      .fillColor('#888888')
      .fontSize(9)
      .text(`Version ${rulesVersion} — Généré le ${dateStr}`, { align: 'center' });
    doc
      .fillColor('#aaaaaa')
      .fontSize(8)
      .text(`Hash : ${hashShort} — Ce document est horodaté et opposable`, { align: 'center' });
    doc.moveDown(1);

    // ─── Info table ───────────────────────────────────────────────────────────
    const rows: [string, string][] = [
      ['Organisateur', 'SKY PLAY ENTERTAINMENT'],
      ['Type de compétition', typeLabel],
      ['Jeu', challenge.game],
      ['Frais d\'inscription (Pass)', formatCFA(entryFee)],
      ['Format', challenge.maxPlayers === 2 ? 'Match unique' : `${challenge.maxPlayers} joueurs`],
      ['Dotation totale', formatCFA(potTotal)],
      ['Prime de performance — 1er', formatCFA(prizeFirst)],
      ['Frais d\'organisation', `${formatCFA(Math.round(potTotal * commission))} (${orgFee}%)`],
    ];

    const colX = [50, 280];
    const rowH = 22;
    let y = doc.y;

    rows.forEach(([label, value], i) => {
      const bg = i % 2 === 0 ? '#f5f8ff' : '#ffffff';
      doc.rect(50, y, 495, rowH).fillColor(bg).fill();
      doc.fillColor('#555555').fontSize(10).font('Helvetica').text(label, colX[0] + 4, y + 6);
      doc.fillColor('#111111').fontSize(10).font('Helvetica-Bold').text(value, colX[1], y + 6);
      y += rowH;
    });

    doc.y = y + 10;
    doc.moveDown(1);

    // ─── Règles ───────────────────────────────────────────────────────────────
    doc
      .fillColor('#0097FC')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Règles de la compétition');
    doc.moveDown(0.4);

    const rules = [
      ['Critères de victoire', 'Score le plus élevé déclaré avec capture d\'écran obligatoire.'],
      ['Délai de contestation', '30 minutes après la déclaration du résultat.'],
      ['Conditions d\'annulation', 'Remboursement intégral du pass si la compétition n\'est pas complétée sous 24h.'],
      ['Fair-play', 'Tout logiciel de triche entraîne l\'annulation immédiate et la confiscation des primes.'],
      ['Litiges', 'En cas de désaccord, contactez support@skyplay.cm avec preuves sous 30 minutes.'],
    ];

    rules.forEach(([title, desc]) => {
      doc
        .fillColor('#222222')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`• ${title} : `, { continued: true })
        .font('Helvetica')
        .fillColor('#444444')
        .text(desc);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.8);

    // ─── Footer légal ─────────────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fillColor('#888888')
      .fontSize(9)
      .font('Helvetica')
      .text(
        `SKY PLAY ENTERTAINMENT — Compétition fondée sur l'habileté — Cameroun\n` +
        `Ce règlement est publié avant l'ouverture de la compétition et fait foi entre les parties.\n` +
        `Version ${rulesVersion} — Hash SHA256 : ${rulesHash}\n` +
        `Ce document fait foi en cas de litige. support@skyplay.cm`,
        { align: 'center' },
      );

    doc.end();
  }

  @UseGuards(JwtDualGuard)
  @Post()
  create(@Body() dto: CreateChallengeDto, @Request() req) {
    return this.challengesService.create(req.user.id, dto.title, dto.game, dto.type);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/accept-rules')
  acceptRules(
    @Param('id') id: string,
    @Body() dto: { rulesVersion: string; rulesHash: string },
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.challengesService.acceptRules(id, req.user.id, dto, ip, userAgent);
  }

  @UseGuards(JwtDualGuard)
  @Get(':id/rules-acceptance')
  getRulesAcceptance(@Param('id') id: string, @Request() req) {
    return this.challengesService.getRulesAcceptance(id, req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.challengesService.join(id, req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/submit-result')
  submitResult(
    @Param('id') id: string,
    @Body() dto: SubmitResultDto,
    @Request() req,
  ) {
    return this.challengesService.submitResult(id, req.user.id, dto.rank, dto.screenshotUrl);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/dispute')
  forceDispute(
    @Param('id') id: string,
    @Body() dto: ForceDisputeDto,
    @Request() req,
  ) {
    return this.challengesService.forceDispute(id, req.user.id, dto.reason);
  }

  @UseGuards(JwtDualGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.challengesService.deleteChallenge(id, req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/cancel')
  creatorCancel(@Param('id') id: string, @Request() req) {
    return this.challengesService.creatorCancelChallenge(id, req.user.id);
  }
}

@Controller('admin/challenges')
@UseGuards(JwtDualGuard)
export class AdminChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  private ensureAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }

  @Get('disputes')
  getDisputes(@Request() req, @Query('status') status?: string) {
    this.ensureAdmin(req);
    return this.challengesService.getDisputes(status);
  }

  @Get('disputes/:id')
  getDispute(@Param('id') id: string, @Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.getDisputeById(id);
  }

  @Post('disputes/:id/resolve')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req,
  ) {
    this.ensureAdmin(req);
    return this.challengesService.resolveDispute(id, dto.winnerId, dto.adminNote, req.user.id);
  }

  @Get('winnings/pending')
  getWinningsPending(@Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.getWinningsPending();
  }

  @Post('winnings/:id/approve')
  approveWinnings(@Param('id') id: string, @Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.approveWinnings(id, req.user.id);
  }

  @Post('winnings/:id/reject')
  rejectWinnings(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.rejectWinnings(id, body.reason, req.user.id);
  }

  @Post(':id/cancel')
  adminCancelChallenge(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.cancelChallenge(id, body.reason ?? 'Annulé par admin', req.user.id);
  }
}
