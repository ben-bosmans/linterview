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
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService<Config>,
  ) {}

  /**
   * Sign up a user
   * @param email User's email
   * @param password User's password
   * @returns Access and refresh tokens
   */
  async signUp(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (user) throw new BadRequestException('Unable to create account');

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });

    return await this.getTokens(newUser.id, email);
  }

  /**
   * Sign in a user
   * @param email User's email
   * @param password User's password
   * @returns Access and refresh tokens
   */
  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordCorrect = await argon2.verify(user.password, password);

    if (passwordCorrect) {
      return await this.getTokens(user.id, email);
    } else throw new UnauthorizedException('Invalid credentials');
  }

  async signOut(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.delete({ where: { tokenHash } });
  }

  /**
   * Refresh a user's access token and rotate their refresh token
   * @param refreshToken User's refresh token
   * @returns Access and refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    const refreshTokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    // If the hashed refresh token doesn't exist in the DB, the session never existed or has expired
    if (!refreshTokenRecord) throw new UnauthorizedException('Session expired');
    // Delete the stored refresh token regardless of if it exists or not, as we will rotate existing refresh tokens
    await this.prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id },
    });
    // If the refresh token is expired, the user must re-authenticate
    if (refreshTokenRecord.expiresAt < new Date())
      throw new UnauthorizedException('Session expired');
    // Otherwise, we can sign them in
    return await this.getTokens(
      refreshTokenRecord.user.id,
      refreshTokenRecord.user.email,
    );
  }

  /**
   * Get new access and refresh tokens for a user
   * @param userId User's id
   * @param email User's email
   * @returns Access and refresh tokens
   */
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

  /**
   * Generate an access token for a user
   * @param userId User's id
   * @param email User's email
   * @returns Access token
   */
  private async getAccessToken(userId: string, email: string) {
    const payload: Partial<JwtPayload> = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    return accessToken;
  }

  /**
   * Generate a refresh token for a user, add it to db
   * @param userId User's id
   * @returns Refresh token
   */
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

  /**
   * Hash a refresh token for storage or comparison with a stored refresh token
   * @param refreshToken Refresh token
   * @returns Hashed refresh token
   */
  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
