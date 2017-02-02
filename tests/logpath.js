/* jshint
   node: true, devel: true, maxstatements: 7,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it */

/**
 * logpath.js - Mocha logpath test
 * require: logpath
 */
'use strict';

if (require('./testconf').logpath) {
  describe('logpath.js', function () {
    var assert = require('assert');

    var getLogpath = require('../src/logpath');

    it('getLogpath should be a function', function () {
      assert.strictEqual(typeof getLogpath, 'function');
    });

    it('getLogpath() should return string', function () {
      assert.strictEqual(typeof getLogpath(), 'string');
    });
  });
}
