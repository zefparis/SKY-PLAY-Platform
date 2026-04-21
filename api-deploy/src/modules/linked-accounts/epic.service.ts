import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EpicService {
  constructor(private config: ConfigService) {}

  getAuthUrl(userId: string): string {
    const params = new URLSearchParams({
      client_id: this.config.get('EPIC_CLIENT_ID'),
      redirect_uri: this.config.get('EPIC_REDIRECT_URI'),
      response_type: 'code',
      scope: 'basic_profile',
      state: userId,
    });
    return `https://www.epicgames.com/id/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const credentials = Buffer.from(
      `${this.config.get('EPIC_CLIENT_ID')}:${this.config.get('EPIC_CLIENT_SECRET')}`,
    ).toString('base64');

    const res = await fetch('https://api.epicgames.com/epic/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code }).toString(),
    });
    const data = await res.json();
    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  }

  async getEpicProfile(accessToken: string): Promise<{ epicId: string; username: string }> {
    const res = await fetch('https://api.epicgames.com/epic/id/v2/accounts/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { epicId: data.accountId, username: data.displayName };
  }
}
