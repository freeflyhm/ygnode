/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* schemas/user.js - Mocha schemas/user test */
'use strict';

if (require('./testconf').schemasUser) {
  describe('schemas/user.js', function () {
    var assert = require('assert');
    var SchemaUser = require('../src/app/schemas/user');

    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'auth');
    var User = Conn.model('User', SchemaUser);

    // var bcrypt = require('bcrypt-nodejs');

    var mongoose = require('mongoose');
    var companyId = new mongoose.Types.ObjectId();

    var userObj = {
      company: companyId,
      userName: 'test4',
      password: '123456',
      companyAbbr: 'tt',
      name: 'hemiao',
      phone: 11111111111,
    };
    var uid;

    describe('pre save && comparePassword', function () {
      it('isNew createAt === updateAt', function (done) {
        var newUser = new User(userObj);
        newUser.save(function (err, user) {
          assert.strictEqual(err, null);
          assert.strictEqual(user.meta.createAt.valueOf(),
              user.meta.updateAt.valueOf());
          uid = user._id;
          done();
        });
      });

      it('comparePassword !isMatch', function (done) {
        User.findOne({ _id: uid }, function (err, user) {
          assert.strictEqual(err, null);

          user.comparePassword({}, function (err) {
            assert.strictEqual(err, 'Incorrect arguments');
            done();
          });
        });
      });

      it('comparePassword isMatch', function (done) {
        User.findOne({ _id: uid }, function (err, user) {
          assert.strictEqual(err, null);
          user.comparePassword(userObj.password, function (err, isMatch) {
            assert.strictEqual(err, null);
            assert.strictEqual(isMatch, true);
            done();
          });
        });
      });

      it('!isNew createAt < updateAt', function (done) {
        User.findOne({ _id: uid }, function (err, user) {
          assert.strictEqual(err, null);
          user.save(function (err, user) {
            assert.strictEqual(err, null);
            assert(user.meta.createAt.valueOf() < user.meta.updateAt.valueOf());
            done();
          });
        });
      });
    });

    // describe('statics', function () {
    //   it('_bcryptGenSalt err', function (done) {
    //     User._bcryptGenSalt(bcrypt, {}, { password: null }, function (results) {
    //       assert.strictEqual(results, 'Missing salt rounds');
    //       done();
    //     });
    //   });

    //   it('findOneById', function (done) {
    //     User.findOneById(uid, function (err, user) {
    //       assert.strictEqual(err, null);
    //       assert.strictEqual(user.phone, userObj.phone);
    //       done();
    //     });
    //   });

    //   // it('findByCompany', function (done) {
    //   //   console.log(userObj.company);
    //   //   User.findByCompany(userObj.company, function (err, users) {
    //   //     assert.strictEqual(err, null);
    //   //     assert.strictEqual(users[0].phone, userObj.phone);
    //   //     done();
    //   //   });
    //   // });

    //   it('findOneByUserName', function (done) {
    //     User.findOneByUserName(userObj.userName, function (err, user) {
    //       assert.strictEqual(err, null);
    //       assert.strictEqual(user.phone, userObj.phone);
    //       done();
    //     });
    //   });
    // });

    after(function (done) {
      User.remove({ _id: uid }, function () {
        done();
      });
    });
  });
}
