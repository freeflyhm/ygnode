/* jshint
   node: true, devel: true, maxstatements: 32, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* controllers/bp.js - Mocha controllers/bp test */
'use strict';

if (require('./testconf').controllersBp) {
  describe('controllers/bp.js', function () {
    var assert = require('assert');
    var dbHost = process.env.DB_HOST_TEST;
    var createCtrl = require('../src/app/controllers/bp');
    var Bp = createCtrl(dbHost, 'sz');
    var Conn = require('../src/app/conn')(dbHost, 'sz');
    var SchemaBp = require('../src/app/schemas/bp');
    var BpModel = Conn.model('Bp', SchemaBp);

    var newBp = {
      bpDate: '2016-09-26',
      bpType: 1,
      bpNum: 1000,
      bpNote: 'dd',
    };

    var bpObj;

    describe('list', function () {
      it('should === 21906', function (done) {
        Bp._listFind({ _id: {} }, 2, 4, 5, function (result) {
          assert.strictEqual(JSON.stringify(result), '{}');
          done();
        });
      });

      it('should === 21902', function (done) {
        Bp.list({}, { category: {} }, function (result) {
          assert.strictEqual(JSON.stringify(result), '{}');
          done();
        });
      });

      it('should === 21904', function (done) {
        Bp.list({ bpcompany: {} }, { category: 20 }, function (result) {
          assert.strictEqual(JSON.stringify(result), '{}');
          done();
        });
      });

      // '{"bps":[],"companys":[],"totalPage":0}'
      it('should === ok', function (done) {
        Bp.list(
          { bpcompany: '556fb14c8d2a5b56331b0344', bpmonth: '2016-05' },
          { category: 20 },
          function (result) {
            assert.strictEqual(result.totalPage, 0);
            done();
          }
        );
      });

      it('should === ok', function (done) {
        Bp.list(
          { bpcompany: 'all', bpmonth: 'all' },
          { category: 20 },
          function (result) {
            assert.strictEqual(result.totalPage, 0);
            done();
          }
        );
      });
    });

    describe('add', function () {
      it('success === 21908', function (done) {
        Bp.add({ bpType: {} }, function (result) {
          assert.strictEqual(result.success, '21908');
          done();
        });
      });

      it('success === 1', function (done) {
        Bp.add(newBp, function (result) {
          bpObj = result.bp;
          assert.strictEqual(result.success, 1);
          done();
        });
      });
    });

    describe('update', function () {
      it('success === 21910', function (done) {
        Bp.update({ _id: {} }, function (result) {
          assert.strictEqual(result.success, '21910');
          done();
        });
      });

      it('success === 21602', function (done) {
        Bp.update({ _id: undefined }, function (result) {
          assert.strictEqual(result.success, '21602');
          done();
        });
      });

      it('success === 1', function (done) {
        Bp.update({
          _id: bpObj._id,
          bpDate: '2016-09-26',
          bpNum: 2000,
        }, function (result) {
          assert.strictEqual(result.success, 1);
          done();
        });
      });

      it('success === 21912', function (done) {
        Bp.update({
          _id: bpObj._id,
          bpNum: {},
        }, function (result) {
          assert.strictEqual(result.success, '21912');
          done();
        });
      });
    });

    describe('remove', function () {
      it('success === 21914', function (done) {
        Bp.remove({}, function (result) {
          assert.strictEqual(result.success, '21914');
          done();
        });
      });

      it('success === 21914', function (done) {
        Bp.remove({ id: 'ddddd' }, function (result) {
          assert.strictEqual(result.success, '21914');
          done();
        });
      });

      it('success === 1', function (done) {
        Bp.remove(bpObj._id, function (result) {
          assert.strictEqual(result.success, 1);
          done();
        });
      });

      it('success === 21604', function (done) {
        Bp.remove(bpObj._id, function (result) {
          assert.strictEqual(result.success, '21604');
          done();
        });
      });
    });

    after(function (done) {
      BpModel.remove({}, function () {
        done();
      });
    });
  });
}
