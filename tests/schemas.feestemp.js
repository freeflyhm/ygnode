/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* schemas/feestemp.js - Mocha schemas/feestemp test */
'use strict';

if (require('./testconf').schemasFeestemp) {
  describe('schemas/feestemp.js', function () {
    var assert = require('assert');
    var SchemaFeestemp = require('../src/app/schemas/feestemp');

    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'sz');
    var Feestemp = Conn.model('Feestemp', SchemaFeestemp);

    var feestempObj = {
      name: 'testFeestemp',
      t1: {},
    };
    var fid;

    describe('pre save', function () {
      it('isNew createAt === updateAt', function (done) {
        var newFeestemp = new Feestemp(feestempObj);
        newFeestemp.save(function (err, feestemp) {
          assert.strictEqual(err, null);
          assert.strictEqual(feestemp.meta.createAt.valueOf(),
              feestemp.meta.updateAt.valueOf());
          fid = feestemp._id;
          done();
        });
      });

      it('!isNew createAt < updateAt', function (done) {
        Feestemp.findOne({ _id: fid }, function (err, feestemp) {
          assert.strictEqual(err, null);
          feestemp.save(function (err, feestemp) {
            assert.strictEqual(err, null);
            assert(feestemp.meta.createAt.valueOf() <
                feestemp.meta.updateAt.valueOf());
            done();
          });
        });
      });
    });

    // describe('statics', function () {
    //   it('findOneById', function (done) {
    //     Feestemp.findOneById(fid, function (err, feestemp) {
    //       assert.strictEqual(err, null);
    //       assert.strictEqual(feestemp.name, feestempObj.name);
    //       done();
    //     });
    //   });
    // });

    after(function (done) {
      Feestemp.remove({ _id: fid }, function () {
        done();
      });
    });
  });
}
