import { Injectable } from '@nestjs/common';
import { General } from '@prisma/client';
import { injectUserVariables } from 'src/bot/utils/injectUserVariables';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import internal from 'stream';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class ViewReplyBuilder {
  constructor(protected readonly fileStorageService: FileStorageService) {}

  public async createViewReplyMessage(
    ctx: Context,
    properties: General,
    options: ExtraReplyMessage,
  ): Promise<Message> {
    const { description, image } = properties;
    const text = injectUserVariables(ctx, description);

    let imageBuffer: internal.Readable = null;

    if (image) {
      imageBuffer = await this.fileStorageService.getObject(image);
    }

    if (imageBuffer) {
      return ctx.sendPhoto(
        {
          source: imageBuffer,
        },
        {
          caption: text,
          ...options,
        },
      );
    }

    return ctx.reply(text, options);
  }
}
