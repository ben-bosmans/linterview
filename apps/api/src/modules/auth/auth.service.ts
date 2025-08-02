import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/common/config/schema.config';
import * as argon2 from 'argon2';
import {
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES_DAYS,
} from './auth.constants';
import { randomBytes, createHash } from 'crypto';
import { addDays } from 'date-fns';

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
      throw new BadRequestException('Unable to create account');
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });

    return await this.getTokens(newUser.id, email);
  }

  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (await argon2.verify(user.password, password)) {
      return await this.getTokens(user.id, email);
    } else throw new UnauthorizedException('Invalid credentials');
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    console.log(tokenHash);

    const refreshTokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    console.log(refreshTokenRecord);

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Session expired');
    }

    await this.prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id },
    });

    if (refreshTokenRecord.expiresAt < new Date())
      throw new UnauthorizedException('Session expired');

    return await this.getTokens(
      refreshTokenRecord.user.id,
      refreshTokenRecord.user.email,
    );
  }

  private async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(userId, email),
      this.getRefreshToken(userId),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async getAccessToken(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    return accessToken;
  }

  private async getRefreshToken(userId: string) {
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = addDays(new Date(), REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        user: { connect: { id: userId } },
        tokenHash,
        expiresAt,
      },
    });

    return refreshToken;
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
