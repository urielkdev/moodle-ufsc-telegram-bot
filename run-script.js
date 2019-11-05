require('dotenv').config();

const scriptPresence = require('./script-presence');
const scriptGrade = require('./script-grade');

const getPresence = async () => {
  let resp = await scriptPresence();
  resp.map(course => console.log(`${course.title}: ${course.value}%`));
  return;
};

const getGrade = async (username, password, courseTitle) => {
  let resp = await scriptGrade(username, password, courseTitle);
  console.log(resp);
  resp.map(grade => console.log(`${grade.title}: ${grade.value}`));
  return;
};

// getPresence();
getGrade(
  process.env.MOODLE_USERNAME,
  process.env.MOODLE_PASSWORD,
  // "INE5412-04208A (20192) - Sistemas Operacionais I"
  // "INE5421-05208 (20192) - Linguagens Formais e Compiladores"
  // "INE5422-05208 (20192) - Redes de Computadores II"
  "INE5423-05208 (20192) - Banco de Dados I"
);