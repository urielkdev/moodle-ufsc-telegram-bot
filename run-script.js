const script = require('./script');

(async () => {
  let resp = await script();
  console.log(resp);
  return;
})();