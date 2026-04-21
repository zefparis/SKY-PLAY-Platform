import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SteamService {
  private readonly apiKey: string;
  private readonly backendUrl: string;
  private readonly frontendUrl: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get('STEAM_API_KEY');
    this.backendUrl = config.get('BACKEND_URL');
    this.frontendUrl = config.get('FRONTEND_URL');
  }

  getAuthUrl(userId: string): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${this.backendUrl}/auth/steam/callback?userId=${userId}`,
      'openid.realm': this.backendUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  async verifyCallback(query: Record<string, string>): Promise<string | null> {
    const params = new URLSearchParams({ ...query, 'openid.mode': 'check_authentication' });
    const res = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await res.text();
    if (!text.includes('is_valid:true')) return null;

    const match = query['openid.claimed_id']?.match(/\/id\/(\d+)$/);
    return match ? match[1] : null;
  }

  async getSteamProfile(steamId: string): Promise<{
    steamId: string; username: string; avatarUrl: string; profileUrl: string;
  }> {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${this.apiKey}&steamids=${steamId}`;
    const res = await fetch(url);
    const data = await res.json();
    const player = data?.response?.players?.[0];
    if (!player) throw new Error('Profil Steam introuvable');
    return {
      steamId,
      username: player.personaname,
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl,
    };
  }
}
