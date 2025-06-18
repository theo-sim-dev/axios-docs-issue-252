// Verifying this issue: https://github.com/axios/axios/issues/6846 and https://github.com/axios/axios-docs/issues/252
const axios = require('axios');

// 1. Using default axios(config)
axios({
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  method: 'get'
})
  .then(response => {
    console.log('Default axios(config) result:');
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error with axios(config):', error.message);
  });

// 2. Using instance(config)
const instance = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: { 'X-Test-Header': 'HelloWorld' }
});

instance({
  url: '/todos/1',
  method: 'get'
})
  .then(response => {
    console.log('instance(config) result:');
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error with instance(config):', error.message);
  });
