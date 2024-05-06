import { Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import Fuse from 'fuse.js';
import { SEARCH_GAME_SCENE_ID } from './constants';
import { DatabaseService } from 'src/database/database.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';

@Scene(SEARCH_GAME_SCENE_ID)
@Injectable()
export class SearchGameScene {
  constructor(private readonly databaseService: DatabaseService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    const query: string = (ctx.scene.state['query'] || '').trim();

    if (query) {
      await ctx.reply('Пробуем найти игру по запросу...');

      const games = await this.databaseService.game.findMany();

      const fuse = new Fuse(games, {
        keys: ['name'],
      });

      const items = fuse.search(query);

      if (items.length > 0) {
        await this.showSelectedGames(
          ctx,
          items.map((item) => item.item as Game),
        );
      } else {
        await ctx.reply(
          'К сожалению, по заданному запросу игр не найдено. Ты можешь прпобовать ввести название по-другому или вернуться и поискать игры для конкретной платформы.',
        );
      }
    }
  }

  async showSelectedGames(ctx: SceneContext, games: Game[]) {
    await ctx.reply('Мы нашли следующие игры по твоему запросу:', {
      reply_markup: {
        inline_keyboard: games.map((game) => [
          {
            text: game.name,
            url: game.url,
          },
        ]),
      },
    });
  }

  @On('message')
  async reenter(@Ctx() ctx: SceneContext) {
    await ctx.scene.reenter();
  }
}
