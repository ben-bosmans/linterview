import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  signUpSchema,
  SignInDto,
  signInSchema,
  accessTokenSchema,
  AccessTokenDto,
} from '@linterview/dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { Response, Request } from 'express';
import {
  REFRESH_TOKEN_COOKIE_KEY,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from './auth.constants';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/common/config/schema.config';
import { SerializeResponse } from 'src/common/decorators/serialize-response.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService<Config>,
  ) {}

  @Post('signup')
  @Public()
  @SerializeResponse(accessTokenSchema)
  async signUp(
    @Body(new ZodValidationPipe(signUpSchema)) body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.signUp(body.email, body.password);
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return tokens;
  }

  @Post('signin')
  @Public()
  @SerializeResponse(accessTokenSchema)
  async signIn(
    @Body(new ZodValidationPipe(signInSchema)) body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.signIn(body.email, body.password);
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return tokens;
  }

  @Post('refresh')
  @Public()
  @SerializeResponse(accessTokenSchema)
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenDto> {
    const refreshToken = (request.cookies as Record<string, string>)[
      REFRESH_TOKEN_COOKIE_KEY
    ];
    if (!refreshToken) throw new UnauthorizedException();
    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return tokens;
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'development',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
  }
}
