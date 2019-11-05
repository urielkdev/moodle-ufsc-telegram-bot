require('dotenv').config();
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
// const { leave } = Stage

const scriptGetCourses = require('./script-get-courses');
const scriptPresence = require('./script-presence');
const scriptGrades = require('./script-grade');

const bot = new Telegraf(process.env.BOT_TOKEN);

const welcomeMessage = `
Olá, sou um bot utilitário do moodle UFSC.
Precisa de ajuda? Digite /help
`;
const helpMessage = `
/login usuario senha  -  para poder logar no seu moodle
/presencas  -  para ver as porcentagens de presenças sobre sessões anotadas (precisa estar logado)
/notas  -  para ver as notas de determinada matéria (precisa estar logado)

contato: urielkindermann@gmail.com
`;

const loginMessage = `
---------------------------------------------


Login registrado com sucesso!
Para consultar suas presenças use o comando: /presencas
Para consultar suas notas use o comando: /notas


---------------------------------------------
`;

let login = {};

bot.start(ctx => ctx.reply(welcomeMessage));

bot.help(ctx => ctx.reply(helpMessage));

// /login
bot.hears([/login (.+)/, '/login'], async ctx => {
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

// /presencas
bot.command('presencas', async ctx => {
  let userId = ctx.update.message.from.id;

  if (!login[userId] || !login[userId].username || !login[userId].password)
    return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');

  let computandoMsg = await ctx.reply('Computando... Aguarde...');
  try {
    let resp = await scriptPresence(login[userId].username, login[userId].password);
    ctx.tg.deleteMessage(computandoMsg.chat.id, computandoMsg.message_id);
    await ctx.reply('Porcentagem de presença sobre sessões anotadas:');
    resp.map(course => ctx.reply(`${course.title}: ${course.value}%`));
  } catch (err) {
    console.log(err);
    ctx.reply('Erro inesperado, verifique seu login, caso o erro persistir contate o suporte');
  }
});

// Grade scene
const gradeScene = new Scene('gradeScene')
gradeScene.enter(async ctx => {
  let userId = ctx.update.message.from.id;

  if (!login[userId] || !login[userId].username || !login[userId].password)
    return ctx.reply('Preencha o usuário e a senha, digite /help para mais informações!');

  let computandoMsg = await ctx.reply('Computando... Aguarde...');
  try {
    let resp = await scriptGetCourses(login[userId].username, login[userId].password);
    ctx.tg.deleteMessage(computandoMsg.chat.id, computandoMsg.message_id);
    let courses = resp.map(course => `Matéria: ${course.title}`);
    ctx.reply('Selecione uma matéria', Markup
      .keyboard(courses)
      .oneTime()
      .resize()
      .extra()
    )
  } catch (err) {
    console.log(err);
    ctx.reply('Erro inesperado, verifique seu login, caso o erro persistir contate o suporte');
    return;
  }
});

// When click in the button of Markup keyboard
gradeScene.hears(/Matéria: (.+)/, async ctx => {
  let userId = ctx.update.message.from.id;
  let computandoMsg = await ctx.reply('Computando... Aguarde...');
  try {
    let course = ctx.match[1];
    let resp = await scriptGrades(login[userId].username, login[userId].password, course);
    ctx.tg.deleteMessage(computandoMsg.chat.id, computandoMsg.message_id);
    await ctx.reply(`Notas para a matéria ${course}:`);
    resp.map(grade => ctx.reply(`${grade.title}: ${grade.value}`));
  } catch (err) {
    console.log(err);
    ctx.reply('Erro inesperado, verifique seu login, caso o erro persistir contate o suporte');
  }
  // think how to do this \/, when?
  // Extra.markup((m) => m.removeKeyboard());
  ctx.scene.leave();
});

// Create scene manager
const stage = new Stage()

// Scene registration
stage.register(gradeScene)

bot.use(session())
bot.use(stage.middleware())
bot.command('notas', ctx => ctx.scene.enter('gradeScene'))

bot.startWebhook('/secret-path', null, process.env.PORT || 5000);
bot.launch();