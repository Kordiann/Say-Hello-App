const request = require('supertest');

const app = require('../src/app');

describe('GET /api/v1', () => {
  it('responds with a json message', function(done) {
    request(app)
      .get('/api/v1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, {
        message: 'API - 👋🌎🌍🌏' 
      }, done);
  });
});

describe('POST /api/v1/messages', () => {
  it('responds with inserted message', function(done) {
    const requestObj = {
      name: 'CJ',
      message: 'coolest app ever',
      latitude: -90,
      longitude: 180,
    };

    const responseObj = {
      ...requestObj,
      _id: '5bb8d3035bfab928dc59be76',
      date: '2018-10-06T15:21:39.414Z',
    }

    request(app)
      .post('/api/v1/messages')
      .send(requestObj)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(res => {
        res.body._id = "5bb8d3035bfab928dc59be76"
        res.body.date = "2018-10-06T15:21:39.414Z"
      })
      .expect(200, responseObj, done);
  });

});
