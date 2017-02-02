/* jshint
   node: true, devel: true, maxstatements: 30, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* controllers/serverman.js - Mocha controllers/serverman test */
'use strict';

if (require('./testconf').controllersServerman) {
  var file = 'serverman';
  describe('controllers/' + file + '.js', function () {
    var assert = require('assert');

    var dbHost = process.env.DB_HOST_TEST;

    var createCtrl = require('../src/app/controllers/' + file);
    var TestCr = createCtrl(dbHost, 'sz');

    var TestSchema = require('../src/app/schemas/' + file);
    var Conn = require('../src/app/conn')(dbHost, 'sz');
    var zxutil = require('../src/app/zxutil');
    var TestModel =
        Conn.model(zxutil.validatorReplaceFirstUpper(file), TestSchema);

    var _test = function (test, func) {
      it('success === ' + test.success, function (done) {
        func(test.obj, function (results) {
          assert.strictEqual(results.success, test.success);
          done();
        });
      });
    };

    var _tests = function (tests, func) {
      tests.forEach(function (test) {
        _test(test, func);
      });
    };

    var sid;

    // describe('_addSave', function () {
    //   var test = { obj: { company: {}, name: {} }, success: 11999 };

    //   _test(test, TestCr._addSave);
    // });

    describe('_objSave', function () {
      it('should === 11990', function (done) {
        var newObj = new TestModel({ name: 'hehe' });
        newObj._id = {};

        TestCr._objSave(newObj, function (results) {
          assert.strictEqual(results.success, '11990');
          done();
        });
      });
    });

    describe('_updateSave', function () {
      it('should === 11960', function (done) {
        var obj = { _id: {} };

        TestCr._updateSave(obj, function (results) {
          assert.strictEqual(results.success, '11960');
          done();
        });
      });
    });

    describe('_findOne', function () {
      it('should === 11970', function (done) {
        var obj = { name: {} };

        TestCr._findOne(obj, null, function (results) {
          assert.strictEqual(results.success, '11970');
          done();
        });
      });
    });

    describe('list', function () {
      it('should ok', function (done) {
        TestCr.list({}, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });

      it('should ok', function (done) {
        TestCr.list({ _id: {} }, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });
    });

    describe('add', function () {
      var mongoose = require('mongoose');
      var companyId = new mongoose.Types.ObjectId();

      var obj11014 = { company: {}, name: {} };
      var obj1 = { company: companyId, name: '回调' };
      var tests = [
        { obj: obj11014, success: '11060' },
        { obj: obj1, success: 1 },
        { obj: obj1, success: '11040' },
      ];

      _tests(tests, TestCr.add);
    });

    describe('update', function () {
      it('success === 11060', function (done) {
        TestCr.update(
          { _id: {}, name: 'dd' },
          function (results) {
            assert.strictEqual(results.success, '11060');
            done();
          }
        );
      });

      it('should ok', function (done) {
        TestModel.count({}, function (err, count) {
          var beforeCount = count;
          assert.strictEqual(err, null);
          TestModel.findOne({ name: '回调' }, function (err, res) {
            var beforeTime = res.meta.updateAt.valueOf();
            sid  = res._id;

            assert.strictEqual(err, null);

            TestCr.update(
              { _id: res._id, name: '第三代' },
              function (results) {
                assert.strictEqual(results.success, 1);

                assert.strictEqual(results.res.name, '第三代');
                assert(beforeTime <
                    results.res.meta.updateAt.valueOf());

                TestModel.count({}, function (err, count) {
                  assert.strictEqual(err, null);
                  assert.strictEqual(beforeCount, count);
                  done();
                });
              }
            );
          });
        });
      });
    });

    describe('remove', function () {
      it('should ok', function (done) {
        TestCr.remove(sid, function (results) {
          assert(results.success, 1);
          done();
        });
      });

      it('success === 11995', function (done) {
        TestCr.remove({}, function (results) {
          assert(results.success, 11995);
          done();
        });
      });
    });

    after(function (done) {
      TestModel.remove({}, function () {
        TestModel.find({}, function (err, results) {
          assert.strictEqual(results.length, 0);
          done();
        });
      });
    });
  });
}
