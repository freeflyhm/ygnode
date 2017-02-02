/* jshint
   node: true, devel: true, maxstatements: 9,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it */

/* ctrl.js - Mocha ctrl test */
'use strict';

if (require('./testconf').ctrl) {
  describe('Ctrl.getCtrl', function () {
    var assert = require('assert');
    var dbHost = process.env.DB_HOST_TEST;
    var getCtrl = require('../src/app/ctrl');
    var ctrl1 = getCtrl(dbHost, 'sz', 'feestemp');
    var ctrl2 = getCtrl(dbHost, 'sz', 'feestemp');
    var ctrl3 = getCtrl(dbHost, 'sz', 'setplace');
    var ctrl4 = getCtrl(dbHost, 'sz', 'setplace');

    it('ctrl1 === ctrl2', function () {
      assert.deepEqual(ctrl1, ctrl2);
    });

    it('ctrl3 === ctrl4', function () {
      assert.deepEqual(ctrl3, ctrl4);
    });
  });
}
