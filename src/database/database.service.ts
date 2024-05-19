import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { General, Prisma, PrismaClient } from '@prisma/client';
import { BotSceneSession, ViewCode } from 'src/bot/types';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async getViewProperties(code: ViewCode): Promise<General> {
    return this.general.findUniqueOrThrow({
      where: {
        code,
      },
    });
  }

  async pullNotification(activeUsersOnly: boolean = true) {
    const whereOptions: Prisma.NotificationFindFirstArgs['where'] = {
      wasHandled: false,
    };

    if (activeUsersOnly) {
      whereOptions.activeUsersOnly = true;
    }

    const notification = await this.notification.findFirst({
      select: {
        id: true,
        message: true,
      },
      where: whereOptions,
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (notification) {
      await this.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          wasHandled: true,
        },
      });
    }

    return notification;
  }

  async getSessionStats(): Promise<
    { key: string; session: BotSceneSession }[]
  > {
    const stats = await this.session.findMany();

    return stats
      .map(({ key, session }) => {
        const parsedSessionData = JSON.parse(session) as BotSceneSession;
        parsedSessionData.lastRequestDate = new Date(
          parsedSessionData.lastRequestDate || 0,
        );
        return {
          key,
          session: parsedSessionData,
        };
      })
      .sort(
        (a, b) =>
          b.session.lastRequestDate.getTime() -
          a.session.lastRequestDate.getTime(),
      );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
