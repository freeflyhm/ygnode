/* jshint
   node: true, devel: true, maxstatements: 30, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* controllers/feestemp.js - Mocha controllers/feestemp test */
'use strict';

if (require('./testconf').controllersFeestemp) {
  var file = 'feestemp';
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
      it('should === 19990', function (done) {
        var newObj = new TestModel({});
        newObj._id = {};

        TestCr._objSave(newObj, function (results) {
          assert.strictEqual(results.success, '19990');
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
      var obj1 = { name: '回调' };
      var tests = [
        { obj: obj1, success: 1 },
      ];

      _tests(tests, TestCr.add);
    });

    describe('update', function () {
      it('success === 19970', function (done) {
        TestCr.update(
          { _id: {}, name: 'dd' },
          function (results) {
            assert.strictEqual(results.success, '19970');
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
