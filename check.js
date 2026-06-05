const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("SHRINK-0 IN HTML?", data.includes('shrink-0'));
    console.log("HEADER-SEARCH IN HTML?", data.includes('Tìm kiếm...'));
  });
}).on('error', err => {
  console.error("HTTP GET ERROR:", err.message);
});
