import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/common/config/schema.config';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService<Config>,
  ) {}

  async signUp(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (user) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const tokens = await this.getTokens(newUser.id, email);
    await this.createSession(newUser.id, tokens.refreshToken);

    return tokens;
  }

  private async createSession(userId: string, refreshToken: string) {
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.session.create({
      data: {
        user: { connect: { id: userId } },
        refreshTokenHash,
      },
    });
  }

  private async getTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
