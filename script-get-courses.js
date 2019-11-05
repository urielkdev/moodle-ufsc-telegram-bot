require('dotenv').config();
const puppeteer = require('puppeteer');

const script = async (username = process.env.MOODLE_USERNAME,
  password = process.env.MOODLE_PASSWORD) => {
  const browser = await puppeteer.launch({
    // headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const page = await browser.newPage();
  await page.goto('https://sistemas.ufsc.br/login?service=http%3A%2F%2Fmoodle.ufsc.br%2Flogin%2Findex.php', { waitUntil: 'networkidle2' });

  // login
  await page.type('#username', username);
  await page.type('#password', password);
  await Promise.all([
    page.click('[name="submit"'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  // get the courses
  const courses = await page.evaluate(async () => {
    let coursesDiv = document.querySelector('div .box.generalbox');
    if (!coursesDiv)
      return;

    return await Array.from(coursesDiv.querySelectorAll('ul li a'))
      .map(item => ({
        title: item.innerText,
        href: item.href
      }));
  });

  // login error
  if (!courses) {
    await browser.close();
    return 'Erro ao logar';
  }

  return courses;
};

module.exports = script;