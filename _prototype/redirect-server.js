/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');

const server = new http.Server((req, res) => {
  const target = req.url.replaceAll('/redirect/', '/');
  // eslint-disable-next-line no-console
  console.info(`Redirecting ${req.url} ---> to ${target} on port 8081`);
  const url = new URL(target, 'http://localhost:8081');
  res.writeHead(301, {
    Location: url.href
  });
  res.end();
});

server.listen(8082);
// eslint-disable-next-line no-console
console.info('Redirect server startet on port 8082.');
