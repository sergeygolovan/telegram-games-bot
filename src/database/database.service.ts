import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { General, PrismaClient } from '@prisma/client';
import { ViewCode } from 'src/types';

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

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
