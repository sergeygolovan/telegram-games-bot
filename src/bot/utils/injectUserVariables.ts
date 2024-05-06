import { Context } from 'telegraf';

export function injectUserVariables(ctx: Context, text: string) {
  text = text.replaceAll('{first_name}', ctx.from.first_name);
  text = text.replaceAll('{username}', ctx.from.username);
  text = text.replaceAll('<br>', '\n');

  return text;
}
