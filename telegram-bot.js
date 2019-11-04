require('dotenv').config();
const Telegraf = require('telegraf');
const script = require('./presence-script');

const bot = new Telegraf(process.env.BOT_TOKEN);

const welcomeMessage = `
Oi, sou um bot de controle de presença do moodle UFSC.
Precisa de ajuda? Digite /help
`;
const helpMessage = `
/login usuario senha   - para poder logar no seu moodle
/presenca   - para ver as porcentagens de presenças sobre sessões anotadas (precisa estar logado)

contato: urielkindermann@gmail.com
`;

const loginMessage = `
---------------------------------------------


Login registrado com sucesso!
Para consultar suas presenças use o comando: /presenca


---------------------------------------------
`;

let login = {};

bot.start((ctx) => ctx.reply(welcomeMessage));

bot.help((ctx) => ctx.reply(helpMessage));

// /login
bot.hears([/login (.+)/, '/login'], async (ctx) => {
  let userId = ctx.update.message.from.id;
  let req = ctx.match[1].split(' ');
  if (req.length !== 2)
    return ctx.reply('Digite o comando no padrão: /login usuarioExemplo senhaExemplo');

  ctx.deleteMessage();
  ctx.reply(loginMessage);

  console.log(userId + " ------ " + ctx.update.message.from.username);
  login[userId] = {
    username: req[0],
    password: req[1]
  }
});

// /presença
bot.hears('/presenca', async (ctx) => {
  let userId = ctx.update.message.from.id;

  if (!login[userId] || !login[userId].username || !login[userId].password)
    return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');

  ctx.reply('Computando... Aguarde...');
  try {
    let messages = await script(login[userId].username, login[userId].password);
    await ctx.reply('Porcentagem de presença sobre sessões anotadas:');
    messages.map((msg) => ctx.reply(msg));
  } catch (err) {
    console.log(err);
    ctx.reply('Erro inesperado, verifique seu login, caso o erro persistir contate o suporte');
  }
});

bot.startWebhook('/secret-path', null, process.env.PORT || 5000);
bot.launch();