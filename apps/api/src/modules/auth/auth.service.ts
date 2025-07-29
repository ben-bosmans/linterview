import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (user) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });
  }
}
