require('dotenv').config();
const puppeteer = require('puppeteer');

const script = async (username = process.env.MOODLE_USERNAME,
                      password = process.env.MOODLE_PASSWORD) => {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://sistemas.ufsc.br/login?service=http%3A%2F%2Fmoodle.ufsc.br%2Flogin%2Findex.php', { waitUntil: 'networkidle2' });

  // login
  // await page.type('#username', process.env.MOODLE_USERNAME);
  // await page.type('#password', process.env.MOODLE_PASSWORD);
  console.log(username, password);
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
    const pagePresence = await browser.newPage();

    // go to course
    await pagePresence.goto(course.href, { waitUntil: 'networkidle2' });

    // go to presence
    await pagePresence.waitForSelector('li.activity.attendance.modtype_attendance a');
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
    // console.log(`${courses[0].title}: ${percent}% de presença sobre sessões anotadas`);
    await pagePresence.close()
    return `${course.title}: ${percentValue}%`;
    
  });
  
  let res = await Promise.all(promisses);

  await browser.close();
  
  return res;
};

module.exports = script;