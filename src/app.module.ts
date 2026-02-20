import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtGaurd } from './common/guards/jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { ChatMemberModule } from './chat-member/chat-member.module';
import { MessageModule } from './message/message.module';
import { MediaModule } from './media/media.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CloudinaryModule,
    ContactModule,
    ChatModule,
    ChatMemberModule,
    MessageModule,
    MediaModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGaurd,
    },
  ],
})
export class AppModule {}
