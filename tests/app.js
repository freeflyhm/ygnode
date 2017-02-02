/* jshint
   node: true, devel: true, maxstatements: 20, maxparams: 4,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, before, after */

/* app.js - Mocha app test */
'use strict';

if (require('./testconf').app) {
  describe('app/app.js', function () {
    var assert = require('assert');

    var PORT = 3000;
    var site = 'http://localhost:' + PORT;
    var dbHost  = process.env.DB_HOST_TEST;
    var http = require('http');
    var superagent = require('superagent');
    var app = require('../src/app/app')(dbHost);

    var Conn = require('../src/app/conn')(dbHost, 'auth');
    var SchemaUser = require('../src/app/schemas/user');
    var UserModel = Conn.model('User', SchemaUser);

    var serv;

    before(function () {
      serv = http.createServer(app);
      serv.listen(PORT);
    });

    it('app should be a function', function () {
      assert.strictEqual(typeof app, 'function');
    });

    describe('GET /', function () {
      it('should respond to GET', function (done) {
        superagent.get(site).end(function (err, res) {
          assert.strictEqual(err, null);
          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.text, 'server look\'s good');
          done();
        });
      });
    });

    describe('POST /api/register', function () {
      it('should ok', function (done) {
        superagent.post(site + '/api/register').send({
          province: '广东',
          city: '深圳',
          cname: 'testCompany',
          ctel: '',
          cfax: '',
          caddress: '',
          uusername: 'test',
          upassword: '123456',
          uname: '哈哈',
          uphone: 11111111111,
          uqq: 0,
          ucompanyabbr: 'tt',
        }).end(function (err, res) {
          assert.strictEqual(err, null);
          assert.strictEqual(res.body.success, 1);
          done();
        });
      });
    });

    describe('POST /api/login', function () {
      it('success === 10004', function (done) {
        superagent.post(site + '/api/login').send({
          userName: 'test',
          password: '123456',
        }).end(function (err, res) {
          assert.strictEqual(err, null);
          assert.strictEqual(res.body.success, '10004');
          done();
        });
      });

      it('should ok', function (done) {
        UserModel.update(
          { userName: 'test' },
          { $set: { status: true } },
          function (err, res) {
            assert.strictEqual(err, null);
            assert.strictEqual(res.ok, 1);

            superagent.post(site + '/api/login').send({
              userName: 'test',
              password: '123456',
            }).end(function (err, res) {
              assert.strictEqual(err, null);
              assert.strictEqual(res.body.success, 1);
              done();
            });
          }
        );
      });
    });

    describe('GET /api/provincecity', function () {
      it('should ok', function (done) {
        superagent.get(site + '/api/provincecity').end(function (err, res) {
          assert.strictEqual(err, null);
          assert.strictEqual(Object.keys(res.body).length, 2);
          done();
        });
      });
    });

    // describe('GET /api/code/:id', function () {
    //   it('should ok', function (done) {
    //     superagent.get(site + '/api/code/1').end(function (err) {
    //       assert.strictEqual(err, null);
    //       done();
    //     });
    //   });
    // });

    after(function (done) {
      var SchemaCompany = require('../src/app/schemas/company');
      var CompanyModel = Conn.model('Company', SchemaCompany);
      CompanyModel.remove({}, function (err, res) {
        assert.strictEqual(res.result.ok, 1);

        UserModel.remove({}, function (err, res) {
          assert.strictEqual(res.result.ok, 1);
          serv.close();
          done();
        });
      });
    });
  });
}
