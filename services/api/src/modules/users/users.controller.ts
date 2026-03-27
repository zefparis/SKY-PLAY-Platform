import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: { email: string; cognitoSub: string }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      return existing;
    }

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.email.split('@')[0],
      password: '',
      isVerified: false,
    });

    return user;
  }

  @Post('sync')
  async sync(@Headers('authorization') auth: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const idToken = auth.replace('Bearer ', '');
    
    try {
      const decoded = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );

      const email = decoded.email;
      if (!email) {
        throw new UnauthorizedException('Invalid token');
      }

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        user = await this.usersService.create({
          email,
          username: email.split('@')[0],
          password: '',
          isVerified: true,
        });
      } else if (!user.isVerified) {
        user = await this.usersService.update(user.id, {
          isVerified: true,
        });
      }

      return user;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
