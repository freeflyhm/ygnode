/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/* schemas/setplace.js - Mocha schemas/setplace test */
'use strict';

if (require('./testconf').schemasSetplace) {
  describe('schemas/setplace.js', function () {
    var assert = require('assert');
    var SchemaSetplace = require('../src/app/schemas/setplace');

    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'sz');
    var Setplace = Conn.model('Setplace', SchemaSetplace);

    var setplaceObj = {
      name: 'testSetplace',
      t1: {},
    };
    var sid;

    describe('pre save', function () {
      it('isNew createAt === updateAt', function (done) {
        var newSetplace = new Setplace(setplaceObj);
        newSetplace.save(function (err, setplace) {
          assert.strictEqual(err, null);
          assert.strictEqual(setplace.meta.createAt.valueOf(),
              setplace.meta.updateAt.valueOf());
          sid = setplace._id;
          done();
        });
      });

      it('!isNew createAt < updateAt', function (done) {
        Setplace.findOne({ _id: sid }, function (err, setplace) {
          assert.strictEqual(err, null);
          setplace.save(function (err, setplace) {
            assert.strictEqual(err, null);
            assert(setplace.meta.createAt.valueOf() <
                setplace.meta.updateAt.valueOf());
            done();
          });
        });
      });
    });

    after(function (done) {
      Setplace.remove({ _id: sid }, function () {
        done();
      });
    });
  });
}
