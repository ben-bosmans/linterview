import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './common/config/schema.config';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateConfig,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
