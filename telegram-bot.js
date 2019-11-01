require('dotenv').config();
const Telegraf = require('telegraf');
const script = require('./script');

const bot = new Telegraf(process.env.BOT_TOKEN);

const welcomeMessage = `
Oi, sou um bot de controle de presença do moodle UFSC.
Precisa de ajuda? Digite /help
`;
const helpMessage = `
/login usuario senha   - para poder logar no seu moodle
/presenca   - para ver as porcentagens de presenças sobre sessões anotadas (precisa estar logado)
`;

const loginMessage = `
Login registrado com sucesso!
Para consultar suas presenças use o comando: /presenca
`;

let username;
let password;

bot.start((ctx) => ctx.reply(welcomeMessage));

bot.help((ctx) => ctx.reply(helpMessage));

// /login
bot.hears([/login (.+)/, '/login'], async (ctx) => {
  
  let req = ctx.match[1].split(' ');
  if (req.length !== 2)
    return ctx.reply('Digite o comando no padrão: /login usuarioExemplo senhaExemplo');
 
  ctx.deleteMessage();
  await ctx.reply('----------------------------');
  await ctx.reply('----------------------------');
  await ctx.reply('----------------------------');
  ctx.reply(loginMessage);
  username = req[0];
  password = req[1];
});

// /presença
bot.hears('/presenca', async (ctx) => {
  return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');
  if (!username || !password)
    return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');

  ctx.reply('Computando... Aguarde...');
  let messages = await script(username, password);
  await ctx.reply('Porcentagem de presença sobre sessões anotadas:');
  messages.map((msg) => ctx.reply(msg));
  
});

bot.launch()