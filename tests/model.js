/* jshint
   node: true, devel: true, maxstatements: 8,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it */

/**
 * model.js - Mocha model test
 * require: app/model
 */
'use strict';

if (require('./testconf').model) {
  describe('model.js', function () {
    var assert = require('assert');
    var getModel = require('../src/app/model');

    it('getModel should be a function', function () {
      assert.strictEqual(typeof getModel, 'function');
    });

    it('model1 === model2 && model3 === model4', function () {
      var dbHost = process.env.DB_HOST_TEST;
      var model1 = getModel(dbHost, 'auth', 'user');
      var model2 = getModel(dbHost, 'auth', 'user');
      var model3 = getModel(dbHost, 'auth', 'company');
      var model4 = getModel(dbHost, 'auth', 'company');
      assert.deepEqual(model1, model2);
      assert.deepEqual(model3, model4);
    });
  });
}
