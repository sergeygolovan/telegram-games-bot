import { Context } from 'telegraf';

export function injectUserVariables(ctx: Context, text: string) {
  const username = (ctx.from.username || 'Аноним').replace(/<|>/g, '');
  const firstName = (ctx.from.first_name || 'Аноним').replace(/<|>/g, '');
  text = text.replaceAll('{first_name}', firstName);
  text = text.replaceAll('{username}', username);
  text = text.replaceAll('<br>', '\n');

  return text;
}
