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
  ctx.reply('----------------------------');
  ctx.reply('Login registrado com sucesso');
  username = req[0];
  password = req[1];
});

// /presença
bot.hears('/presenca', async (ctx) => {
  if (!username || !password)
    return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');

  ctx.reply('Computando... Aguarde...');
  let messages = await script(username, password);
  ctx.reply('Porcentagem de presença sobre sessões anotadas:');
  messages.map((msg) => ctx.reply(msg));
  
});

bot.launch()