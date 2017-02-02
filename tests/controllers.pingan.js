/* jshint
   node: true, devel: true, maxstatements: 30, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/**
 * controllers/pingan.js - Mocha controllers/pingan test
 */
'use strict';

if (require('./testconf').controllersPingan) {
  describe('controllers/pingan.js', function () {
    var assert = require('assert');
    var dbHost = process.env.DB_HOST_TEST;

    var ConnSz = require('../src/app/conn')(dbHost, 'sz');
    var SchemaPingan = require('../src/app/schemas/pingan');
    var PinganModel = ConnSz.model('Pingan', SchemaPingan);

    var createCtrl = require('../src/app/controllers/pingan');
    var Pingan = createCtrl(dbHost, 'sz');

    describe('list', function () {
      it('success === 22906', function (done) {
        Pingan._listFind(
          { _id: {} },
          1, null, null,
          function (result) {
            assert.strictEqual(JSON.stringify(result), '{}');
            done();
          }
        );
      });

      it('success === 22902', function (done) {
        Pingan.list({ servermanSearch: { _id: {} } }, function (result) {
          assert.strictEqual(JSON.stringify(result), '{}');
          done();
        });
      });

      it('success === 22904', function (done) {
        Pingan.list(
          { servermanSearch: {}, search: { _id: {} } },
          function (result) {
            assert.strictEqual(JSON.stringify(result), '{}');
            done();
          }
        );
      });

      it('should ok', function (done) {
        Pingan.list(
          { servermanSearch: {}, search: {} },
          function (result) {
            assert.strictEqual(result.totalPage, 0);
            done();
          }
        );
      });

      it('should ok', function (done) {
        Pingan.list(
          {
            servermanSearch: {},
            search: {},
            livedate: 'all',
            server: 'all',
            filter: 1,
          },
          function (result) {
            assert.strictEqual(result.totalPage, 0);
            done();
          }
        );
      });

      it('should ok', function (done) {
        Pingan.list(
          {
            servermanSearch: {},
            search: {},
            livedate: '2015-05',
            server: 'dd',
            filter: 1,
          },
          function (result) {
            assert.strictEqual(result.totalPage, 0);
            done();
          }
        );
      });
    });

    describe('savePingans', function () {
      // { __v: 0,
      //   _id: 57ee0db3b796f704031e7214,
      //   meta:
      //    { updateAt: Fri Sep 30 2016 15:01:07 GMT+0800 (CST),
      //      createAt: Fri Sep 30 2016 15:01:07 GMT+0800 (CST) },
      //   cardType: 1,
      //   isInsurance: 2 }
      // 人为干预结果
      it('success === 22606', function (done) {
        Pingan.savePingans(undefined, function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      // { __v: 0,
      //   _id: 57ee0d3051ee7103eb8c72c7,
      //   meta:
      //    { updateAt: Fri Sep 30 2016 14:58:56 GMT+0800 (CST),
      //      createAt: Fri Sep 30 2016 14:58:56 GMT+0800 (CST) },
      //   cardType: 1,
      //   isInsurance: 2 }
      // 人为干预结果
      it('success === 22606', function (done) {
        Pingan.savePingans(null, function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      // { __v: 0,
      //   _id: 57ee07b275c857023b755dcb,
      //   meta:
      //    { updateAt: Fri Sep 30 2016 14:35:30 GMT+0800 (CST),
      //      createAt: Fri Sep 30 2016 14:35:30 GMT+0800 (CST) },
      //   cardType: 1,
      //   isInsurance: 2 }
      // 人为干预结果
      it('success === 22606', function (done) {
        Pingan.savePingans('', function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      // 人为干预结果 BUG
      it('success === 22606', function (done) {
        Pingan.savePingans('ddd', function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      // { __v: 0,
      //   _id: 57ee0eeb8b3bf6044bf5f83b,
      //   meta:
      //    { updateAt: Fri Sep 30 2016 15:06:19 GMT+0800 (CST),
      //      createAt: Fri Sep 30 2016 15:06:19 GMT+0800 (CST) },
      //   cardType: 1,
      //   isInsurance: 2 }
      // 人为干预结果
      it('success === 22606', function (done) {
        Pingan.savePingans({}, function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      it('success === 22606', function (done) {
        // p = undefined
        Pingan.savePingans([], function (result) {
          assert.strictEqual(result.success, '22606');
          done();
        });
      });

      it('count === 0', function (done) {
        PinganModel.count({}, function (err, len) {
          assert.strictEqual(err, null);
          assert.strictEqual(len, 0);
          done();
        });
      });

      it('success === 1', function (done) {
        Pingan.savePingans([
          { pinganCardNum: '0' },
        ], function (result) {
          assert.strictEqual(result.success, 1);
          done();
        });
      });

      it('success === 22910', function (done) {
        Pingan.savePingans([
          { pinganCardNum: '1', password: '0' },
          { pinganCardNum: '1' },
          { pinganCardNum: '2' },
          { pinganCardNum: '2' },
          { pinganCardNum: '3' },
          { pinganCardNum: '3' },
        ], function (result) {
          assert.strictEqual(result.success, '22910');
          done();
        });
      });

      it('count === 4', function (done) {
        PinganModel.count({}, function (err, len) {
          assert.strictEqual(err, null);
          assert.strictEqual(len, 4);
          done();
        });
      });
    });

    describe('updatePingan', function () {
      it('success === 22908', function (done) {
        Pingan.updatePingan(
          { id: {}, set: { password: '1' } },
          function (result) {
            assert.strictEqual(result.success, '22908');
            done();
          }
        );
      });

      it('success === 1', function (done) {
        PinganModel.findOne({ pinganCardNum: '1' }, function (err, p) {
          assert.strictEqual(err, null);
          Pingan.updatePingan(
            { id: p._id, set: { password: '1' } },
            function (result) {
              assert.strictEqual(result.success, 1);
              done();
            }
          );
        });
      });

      it('success === 22602', function (done) {
        PinganModel.findOne({ pinganCardNum: '1' }, function (err, p) {
          assert.strictEqual(err, null);
          Pingan.updatePingan(
            { id: p._id, set: { password: '1' } },
            function (result) {
              assert.strictEqual(result.success, '22602');
              done();
            }
          );
        });
      });
    });

    describe('findPingansIn', function () {
      it('success === 22912', function (done) {
        Pingan.findPingansIn([{}], function (result) {
          assert.strictEqual(result.success, '22912');
          done();
        });
      });

      // { success: 1, pingans: [] }
      it('success === 1', function (done) {
        Pingan.findPingansIn(
          ['57ee0de302bb4e18002cad03'],
          function (result) {
            assert.strictEqual(result.success, 1);
            done();
          }
        );
      });

      // { success: 1, pingans: [ { pinganCardNum: '1' } ] }
      it('success === 1', function (done) {
        Pingan.findPingansIn(
          ['57ee0de302bb4e18002cad03', '1'],
          function (result) {
            assert.strictEqual(result.success, 1);
            done();
          }
        );
      });
    });

    describe('Step12downloadImg', function () {
      it('success === 1', function (done) {
        assert.strictEqual(typeof Pingan.Step12downloadImg, 'function');
        var url12 = 'http://pingan.com/sics/sicsweb/image.jsp';
        Pingan.Step12downloadImg(url12, function (result) {
          assert.strictEqual(result.success, 1);
          done();
        });
      });

      it('success === 22999', function (done) {
        var url12 = 'dd';
        Pingan.Step12downloadImg(url12, function (result) {
          assert.strictEqual(result.success, '22999');
          done();
        });
      });
    });

    after(function (done) {
      PinganModel.remove({}, function () {
        done();
      });
    });
  });
}
