import http from 'http';

const options = {
  hostname: '10.95.178.73',
  port: 3000,
  path: '/api/v1/health', // assuming there is a health check or just any route
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
