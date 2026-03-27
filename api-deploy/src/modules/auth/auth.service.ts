import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) {}

  async me(user: RequestUser) {
    // On renvoie une version “safe” + données DB à jour
    const dbUser = await this.usersService.findById(user.id);
    if (!dbUser) {
      // edge case: user supprimé en DB, mais token valide
      return { user };
    }
    // Ne jamais renvoyer password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = dbUser as any;
    return { user: safe };
  }
}
