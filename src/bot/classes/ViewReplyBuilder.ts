import { injectUserVariables } from 'src/bot/utils/injectUserVariables';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewCode } from 'src/bot/types';
import internal from 'stream';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { IMessageContent } from '../scenes';
import { General } from '@prisma/client';

export class ViewReplyBuilder {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly fileStorageService: FileStorageService,
  ) {}

  public async createViewReplyMessage(
    ctx: Context,
    viewCode: ViewCode,
    options: ExtraReplyMessage,
  ): Promise<Message> {
    const { text, image } = await this.getViewReplyMessageMarkup(ctx, viewCode);

    if (image) {
      return ctx.sendPhoto(
        {
          source: image,
        },
        {
          caption: text,
          ...options,
        },
      );
    }

    return ctx.reply(text, options);
  }

  public async getViewReplyMessageMarkup(
    ctx: Context,
    viewCode: ViewCode,
    defaultValues: Partial<Omit<General, 'code'>> = {},
  ): Promise<IMessageContent> {
    const properties = await this.databaseService.getViewProperties(viewCode);
    const text = injectUserVariables(
      ctx,
      defaultValues.description || properties.description,
    );

    const image = defaultValues.image || properties.image;
    let imageBuffer: internal.Readable = null;

    if (image) {
      imageBuffer = await this.fileStorageService.getObject(image);
    }

    return { text, image: imageBuffer };
  }
}
