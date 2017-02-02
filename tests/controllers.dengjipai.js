/* jshint
   node: true, devel: true, maxstatements: 30, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/**
 * controllers/dengjipai.js - Mocha controllers/dengjipai test
 */
'use strict';

if (require('./testconf').controllersDengjipai) {
  var file = 'dengjipai';
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

    describe('_objSave', function () {
      it('should === 12990', function (done) {
        var newObj = new TestModel({ name: 'hehe' });
        newObj._id = {};

        TestCr._objSave(newObj, function (results) {
          assert.strictEqual(results.success, '12990');
          done();
        });
      });
    });

    describe('_findOneById', function () {
      it('should === 12960', function (done) {
        var obj = { _id: {} };

        TestCr._findOneById(obj, function (results) {
          assert.strictEqual(results.success, '12960');
          done();
        });
      });
    });

    describe('_findOneByName', function () {
      it('should === 12970', function (done) {
        var obj = { name: {} };

        TestCr._findOneByName(obj, null, function (results) {
          assert.strictEqual(results.success, '12970');
          done();
        });
      });
    });

    describe('list', function () {
      it('should err 12998', function (done) {
        TestCr.list({ _id: {} }, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });

      it('should ok', function (done) {
        TestCr.list({}, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });
    });

    describe('add', function () {
      var obj12014 = { name: {} };
      var obj1 = { name: '何必', password: '123456' };
      var tests = [
        { obj: obj12014, success: '12060' },
        { obj: obj1, success: 1 },
        { obj: obj1, success: '12040' },
      ];

      _tests(tests, TestCr.add);
    });

    describe('update', function () {
      var obj12015 = { name: '何必' };
      var test = { obj: obj12015, success: '12061' };

      _test(test, TestCr.update);

      it('should ok', function (done) {
        TestModel.count({}, function (err, count) {
          var beforeCount = count;
          assert.strictEqual(err, null);
          TestModel.findOne({ name: '何必' }, function (err, res) {
            var beforeTime = res.meta.updateAt.valueOf();
            sid  = res._id;

            assert.strictEqual(err, null);

            TestCr.update(
              { _id: res._id, name: '回调', password: '123456' },
              function (results) {
                assert.strictEqual(results.success, 1);

                assert.strictEqual(results.res.name, '回调');
                assert(beforeTime <
                    results.res.meta.updateAt.valueOf());

                TestModel.count({}, function (err, count) {
                  assert.strictEqual(err, null);
                  assert.strictEqual(beforeCount, count);
                  TestCr.update(
                    { _id: res._id, name: '回调', password: '1234567' },
                    function (results) {
                      assert.strictEqual(results.success, 1);
                      TestCr.update(
                        { _id: '', name: '回调', password: '1234567' },
                        function (results) {
                          assert.strictEqual(results.success, '12050');
                          done();
                        }
                      );
                    }
                  );
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

      it('success === 12995', function (done) {
        TestCr.remove({}, function (results) {
          assert(results.success, 12995);
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
