/* jshint
   node: true, devel: true, maxstatements: 7,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it */

/**
 * conn.js - Mocha conn test
 * require: app/conn
 */
'use strict';

if (require('./testconf').conn) {
  describe('conn.js', function () {
    var assert = require('assert');

    var getConn = require('../src/app/conn');

    it('getConn should be a function', function () {
      assert.strictEqual(typeof getConn, 'function');
    });

    it('conn1 === conn2', function () {
      var dbHost  = process.env.DB_HOST_TEST;
      var conn1   = getConn(dbHost, 'auth');
      var conn2   = getConn(dbHost, 'auth');
      assert.deepEqual(conn1, conn2);
    });
  });
}

