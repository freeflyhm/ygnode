/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/**
 * schemas/dengjipai.js - Mocha schemas/dengjipai test
 * require: app/schemas/dengjipai, app/conn, app/zxutil
 */
'use strict';

if (require('./testconf').schemasDengjipai) {
  var file = 'dengjipai';
  describe('schemas/' + file + '.js', function () {
    var assert = require('assert');
    var TestSchema = require('../src/app/schemas/' + file);

    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'sz');
    var zxutil = require('../src/app/zxutil');
    var TestModel =
        Conn.model(zxutil.validatorReplaceFirstUpper(file), TestSchema);

    var testObj = {
      name: 'test',
    };
    var fid;

    describe('pre save', function () {
      it('isNew createAt === updateAt', function (done) {
        var newObj = new TestModel(testObj);
        newObj.save(function (err, result) {
          assert.strictEqual(err, null);
          assert.strictEqual(result.meta.createAt.valueOf(),
              result.meta.updateAt.valueOf());
          fid = result._id;
          done();
        });
      });

      it('!isNew createAt < updateAt', function (done) {
        TestModel.findOne({ _id: fid }, function (err, result) {
          assert.strictEqual(err, null);
          result.save(function (err, result) {
            assert.strictEqual(err, null);
            assert(result.meta.createAt.valueOf() <
                result.meta.updateAt.valueOf());
            done();
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
