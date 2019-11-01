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
  // await page.type('#username', process.env.MOODLE_USERNAME);
  // await page.type('#password', process.env.MOODLE_PASSWORD);
  await page.type('#username', username);
  await page.type('#password', password);
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

  let promisses = await courses.map(async (course) => {

    let pagePresence = await browser.newPage();

    // go to course
    await pagePresence.goto(course.href, { waitUntil: 'networkidle2' });

    // go to presence
    await Promise.all([
      pagePresence.click('li.activity.attendance.modtype_attendance a'),
      pagePresence.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // go to all presences
    await pagePresence.waitForSelector('.attbtn a');
    await Promise.all([
      pagePresence.click('.attbtn a'),
      pagePresence.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // get the percent
    let percent = await pagePresence.evaluate(() =>
      Array.from(document.querySelectorAll(".attlist tr"))
        .find((tr) =>
          tr.querySelector('td').innerText === 'Porcentagem sobre sessões anotadas:'
        )
        .querySelector('.lastcol').innerText
    );

    // format the percent
    let percentValue = percent.replace('%', '');
    await pagePresence.close();
    return `${courses[0].title}: ${percentValue}% de presença sobre sessões anotadas`;

  });

  let res = await Promise.all(promisses);

  // i dont know why, but with this the errors goes away (error in kill process)
  setTimeout(() => {
    browser.close();
  }, 100);

  return res;
};

module.exports = script;