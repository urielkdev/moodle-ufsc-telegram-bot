require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://sistemas.ufsc.br/login?service=http%3A%2F%2Fmoodle.ufsc.br%2Flogin%2Findex.php', { waitUntil: 'networkidle2' });

  // login
  await page.type('#username', process.env.MOODLE_USERNAME);
  await page.type('#password', process.env.MOODLE_PASSWORD);
  await Promise.all([
    page.click('[name="submit"'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  // get the courses
  const courses = await page.evaluate(() =>
    Array.from(document.querySelector('div .box.generalbox')
      .querySelectorAll('ul li a'))
      .map(item => ({
        title: item.title,
        href: item.href
      }))
  )

  // go to course
  await page.goto(courses[0].href, { waitUntil: 'networkidle2' });

  // go to presence
  await  page.waitForSelector('li.activity.attendance.modtype_attendance a');
  await Promise.all([
    page.click('li.activity.attendance.modtype_attendance a'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  // go to all presences
  await  page.waitForSelector('.attbtn a');
  await Promise.all([
    page.click('.attbtn a'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  
  // get the percent
  let a = await page.evaluate(() => 
    Array.from(document.querySelectorAll(".attlist tr"))
    .find((tr) => 
      tr.querySelector('td').innerText === 'Porcentagem sobre sessões anotadas:'
    )
    .querySelector('.lastcol').innerText
  );

  console.log(a.replace('%', ''));

  await page.screenshot({ path: './img.png' });
  await browser.close();
})();