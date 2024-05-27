import { Injectable, Logger } from '@nestjs/common';
import { BotSceneSession } from './types';
import { AsyncSessionStore } from 'telegraf/typings/session';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SessionService implements AsyncSessionStore<BotSceneSession> {
  private readonly logger = new Logger(SessionService.name);
  constructor(private readonly databaseService: DatabaseService) {}

  async get(name: string): Promise<BotSceneSession> {
    const sessionData = await this.databaseService.session.findUnique({
      where: {
        key: name,
      },
    });

    if (!sessionData) {
      return undefined;
    }

    try {
      return JSON.parse(sessionData.session);
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }

  async set(key: string, value: BotSceneSession): Promise<unknown> {
    try {
      const data = {
        userId: value.userId,
        userName: value.username,
        session: JSON.stringify(value),
      };
      return this.databaseService.session.upsert({
        where: {
          key,
        },
        create: { key, ...data },
        update: data,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async delete(key: string): Promise<unknown> {
    return this.databaseService.session.delete({
      where: {
        key,
      },
    });
  }
}
