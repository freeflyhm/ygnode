/* jshint
   node: true, devel: true, maxstatements: 30, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* controllers/flag.js - Mocha controllers/flag test */
'use strict';

if (require('./testconf').controllersFlag) {
  var file = 'flag';
  describe('controllers/' + file + '.js', function () {
    var assert = require('assert');
    var dbHost = process.env.DB_HOST_TEST;
    var createCtrl = require('../src/app/controllers/' + file);
    var TestCtrl = createCtrl(dbHost, 'sz');
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

    describe('list', function () {
      it('should ok', function (done) {
        TestCtrl.list({}, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });

      it('should ok', function (done) {
        TestCtrl.list({ _id: {} }, function (result) {
          assert.strictEqual(JSON.stringify(result), '[]');
          done();
        });
      });
    });

    describe.skip('add', function () {
      var mongoose = require('mongoose');
      var companyId = new mongoose.Types.ObjectId();

      var obj11014 = { company: {}, name: {} };
      var obj1 = { company: companyId, name: '回调' };
      var tests = [
        { obj: obj11014, success: '11060' },
        { obj: obj1, success: 1 },
        { obj: obj1, success: '11040' },
      ];

      _tests(tests, TestCtrl.add);
    });

    after(function (done) {
      TestModel.remove({}, function () {
        done();
      });
    });
  });
}
