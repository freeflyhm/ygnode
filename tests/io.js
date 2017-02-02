/* jshint
   node: true, devel: true, maxstatements: 27, maxparams: 4,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, before, after */

/* io.js - Mocha io test */
'use strict';

if (require('./testconf').io) {
  describe('io.js', function () {
    var assert = require('assert');

    var PORT = 3000;
    var site = 'http://localhost:' + PORT;
    var dbHost  = process.env.DB_HOST_TEST;

    var http = require('http');
    var app = require('../src/app/app')(dbHost);

    var superagent = require('superagent');
    var Client = require('socket.io-client');

    var Conn;
    var SchemaCompany;
    var SchemaUser;
    var CompanyModel;
    var UserModel;

    var serv;

    before(function (done) {
      Conn = require('../src/app/conn')(dbHost, 'auth');
      SchemaCompany = require('../src/app/schemas/company');
      SchemaUser = require('../src/app/schemas/user');
      CompanyModel = Conn.model('Company', SchemaCompany);
      UserModel = Conn.model('User', SchemaUser);

      var company1 = new CompanyModel({
        name: 'company1',
        category: 30,
        city: '深圳',
      });

      company1.save(function (err, company) {
        assert.strictEqual(err, null);

        var user1 = new UserModel({
          company: company._id,
          userName: 'user1',
          password: '123456',
          role: 99,
        });

        user1.save(function (err) {
          assert.strictEqual(err, null);

          serv = http.createServer(app);
          require('../src/app/io')(serv);
          serv.listen(PORT);
          done();
        });
      });
    });

    it('should be ok', function (done) {
      superagent.post(site + '/api/login').send({
        userName: 'user1',
        password: '123456',
      }).end(function (err, res) {
        assert.strictEqual(err, null);

        var client1 = Client.connect(site + '/nspzx', {
          query: 'dbName=' + res.body.dbName + '&token=' + res.body.token,
          transports: ['websocket'],
          'force new connection': true,
        });

        var client2 = Client.connect(site + '/nspzx', {
          query: 'dbName=sz&token=' + res.body.token,
          transports: ['websocket'],
          'force new connection': true,
        });

        var client3 = Client.connect(site + '/nspzx', {
          query: 'dbName=sz&token=' + res.body.token,
          transports: ['websocket'],
          'force new connection': true,
        });

        client1.on('connect', function () {
          console.log('client1 connect success');

          // 服务器通知此账号被加入房间
          client1.on('semit-somebodyIsJoinRoom', function () {
            console.log('client1 semit-somebodyIsJoinRoom');
          });

          // 服务器通知此账号自己想要登录
          // 是否拒绝, 由用户决定
          client1.on('sbroadcast-somebodyWantOnline', function () {
            console.log('client1 sbroadcast-somebodyWantOnline');

            // 通知服务器是否拒绝其他人进入房间
            // iscancel 是否拒绝 true 拒绝 false 不拒绝
            client1.emit('cemit-cancelSomebodyOnline', false);
          });

          client1.on('semit-cancelSomebodyOnline', function () {
            console.log('client1 semit-cancelSomebodyOnline');
            client1.disconnect();
            done();
          });

          client1.on('disconnect', function () {
            console.log('client1 disconnected');
          });
        });

        client2.on('connect', function () {
          console.log('client2 connect success');

          // 服务器通知此账号被加入房间
          // client2.on('semit-somebodyIsJoinRoom', function () {
          //   console.log('client2 semit-somebodyIsJoinRoom');
          //   if (ischange) {
          //     client2.emit('cemit-changeRoom', 'gz');
          //     ischange = false;
          //   } else {
          //     done();
          //   }
          // });

          // 服务器通知自己有人已经使用此账号进入房间了
          // 是否要踢人, 由用户决定
          client2.on('semit-somebodyIsOnlined', function () {
            console.log('client2 semit-somebodyIsOnlined');

            // 通知服务器自己想要进入房间
            client2.emit('cemit-somebodyWantOnline');
          });

          client2.on('sbroadcast-somebodyJoinRoom', function () {
            console.log('client2 sbroadcast-somebodyJoinRoom');

            client2.emit('cemit-somebodyJoinRoom');
          });

          client2.on('semit-joinRoomFail', function (res) {
            console.log('--------------------------');
            console.log(res);
            client2.emit('cemit-changeRoom', 'sz');
          });
        });

        client3.on('connect', function () {
          console.log('client3 connect success');

          // 服务器通知自己有人已经使用此账号进入房间了
          // 是否要踢人, 由用户决定
          client3.on('semit-somebodyIsOnlined', function () {
            console.log('client3 semit-somebodyIsOnlined');

            // 通知服务器自己想要进入房间
            client3.emit('cemit-somebodyWantOnline');
          });

          client3.on('disconnect', function () {
            console.log('client3 disconnected');
          });
        });
      });
    });

    it('cemit-getusers', function (done) {
      superagent.post(site + '/api/login').send({
        userName: 'user1',
        password: '123456',
      }).end(function (err, res) {
        assert.strictEqual(err, null);

        var client4 = Client.connect(site + '/nspzx', {
          query: 'dbName=' + res.body.dbName + '&token=' + res.body.token,
          transports: ['websocket'],
          'force new connection': true,
        });

        setTimeout(function () {
          client4.emit('cemit-getusers', null, function (result) {
            assert.strictEqual(result.clientsLength, 3);
            done();
          });
        }, 1000);
      });
    });

    // it('testzx', function (done) {
    //   var client1 = Client.connect(site + '/testzx', {
    //     transports: ['websocket'],
    //     'force new connection': true,
    //   });

    //   var client2 = Client.connect(site + '/testzx', {
    //     transports: ['websocket'],
    //     'force new connection': true,
    //   });

    //   client1.on('connect', function () {
    //     console.log('client1 connect success');

    //     client1.emit('getId', function (result) {
    //       console.log(result);
    //       assert.strictEqual(result, 0);
    //     });
    //   });

    //   client2.on('connect', function () {
    //     console.log('client2 connect success');

    //     client2.emit('getId', function (result) {
    //       console.log(result);
    //       assert.strictEqual(result, 1);
    //       done();
    //     });
    //   });
    // });

    after(function (done) {
      CompanyModel.remove({}, function (err, res) {
        assert.strictEqual(err, null);
        assert.strictEqual(res.result.ok, 1);

        UserModel.remove({}, function (err, res) {
          assert.strictEqual(err, null);
          assert.strictEqual(res.result.ok, 1);
          serv.close();
          done();
        });
      });
    });
  });
}
