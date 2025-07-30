import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  signUpSchema,
  SignInDto,
  signInSchema,
} from '@linterview/dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { Response } from 'express';
import { REFRESH_TOKEN_COOKIE_MAX_AGE } from './constants/auth.constants';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/common/config/schema.config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService<Config>,
  ) {}

  @Post('signup')
  async signUp(
    @Body(new ZodValidationPipe(signUpSchema)) body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.signUp(body.email, body.password);
    this.setRefreshTokenCookie(response, tokens.refreshToken);
  }

  @Post('signin')
  async signIn(
    @Body(new ZodValidationPipe(signInSchema)) body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.signIn(body.email, body.password);
    this.setRefreshTokenCookie(response, tokens.refreshToken);
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('linterview.rt', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'development',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE, // 7 days
    });
  }
}
