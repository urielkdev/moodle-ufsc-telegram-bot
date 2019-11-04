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

  // just for the firsts tests
  course = courses[2];


  let pageGrade = await browser.newPage();

  // go to course
  await pageGrade.goto(course.href, { waitUntil: 'networkidle2' });

  // go to grades
  let gradesExists = await pageGrade.evaluate(async () =>
    await document.getElementById('label_4_39')
  );

  // if grades field doesnt exist
  if (!gradesExists) {
    await pageGrade.close();
    return `${course.title}: não tem o campo de Notas`;
  }

  // if exists, click
  await Promise.all([
    pageGrade.click('#label_4_39'),
    pageGrade.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  // get the grades
  let grades = await pageGrade.evaluate(() => {
    return Array.from(document.querySelectorAll("td.item.column-grade"))
      .map(el => ({
        title: el.parentElement.querySelector('a').innerText,
        value: el.innerText
      }));
  });

  await pageGrade.close();
  await browser.close();
  return grades;

  let res = await Promise.all(promisses);

  // i dont know why, but with this the errors goes away (error in kill process)
  setTimeout(() => {
    browser.close();
  }, 100);

  return res;
};

module.exports = script;