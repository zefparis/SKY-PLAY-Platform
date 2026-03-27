import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: { email: string; cognitoSub: string }) {
    this.logger.log(`📝 Register request: ${dto.email}`);
    
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      this.logger.log(`✅ User already exists: ${dto.email}`);
      return existing;
    }

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.email.split('@')[0],
      password: '',
      isVerified: false,
    });

    this.logger.log(`✅ User created: ${user.id}`);
    return user;
  }

  @Post('sync')
  async sync(@Headers('authorization') auth: string) {
    this.logger.log('🔄 Sync request received');
    
    if (!auth || !auth.startsWith('Bearer ')) {
      this.logger.error('❌ Missing authorization header');
      throw new UnauthorizedException('Missing token');
    }

    const idToken = auth.replace('Bearer ', '');
    
    try {
      const decoded = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );

      const email = decoded.email;
      this.logger.log(`🔍 Decoded email: ${email}`);
      
      if (!email) {
        this.logger.error('❌ No email in token');
        throw new UnauthorizedException('Invalid token');
      }

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        this.logger.log(`📝 Creating new user: ${email}`);
        user = await this.usersService.create({
          email,
          username: email.split('@')[0],
          password: '',
          isVerified: true,
        });
        this.logger.log(`✅ User created: ${user.id}`);
      } else if (!user.isVerified) {
        this.logger.log(`🔄 Updating user verification: ${user.id}`);
        user = await this.usersService.update(user.id, {
          isVerified: true,
        });
        this.logger.log(`✅ User verified: ${user.id}`);
      } else {
        this.logger.log(`✅ User already verified: ${user.id}`);
      }

      return user;
    } catch (e) {
      this.logger.error(`❌ Sync error: ${e.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
