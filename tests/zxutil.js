/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 2,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it */

/**
 * zxutil.js - Mocha zxutil test
 * require: app/zxutil
 */
'use strict';

if (require('./testconf').zxutil) {
  describe('zxutil.js', function () {
    var assert = require('assert');
    var zxutil = require('../src/app/zxutil');
    var _tests = function (tests, func) {
      tests.forEach(function (item) {
        it('test: ' + item.test + ' should return ' + item.expect, function () {
          assert.strictEqual(func(item.test), item.expect);
        });
      });
    };

    var _tests2 = function (tests, func) {
      tests.forEach(function (item) {
        it('test: ' + item.test + ' should return ' + item.expect, function () {
          assert.strictEqual(
            func(item.test.password, item.test.userName),
            item.expect
          );
        });
      });
    };

    // 首字母大写
    describe('validatorReplaceFirstUpper', function () {
      it('should as Should', function () {
        assert.strictEqual(zxutil.validatorReplaceFirstUpper('should'), 'Should');
      });
    });

    // 字母或数字组合
    describe('validatorAlNum', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: true },
        { test: '1a', expect: true },
        { test: 's', expect: true },
      ];

      _tests(tests, zxutil.validatorAlNum);
    });

    // 必须是中文字符
    describe('validatorChineseCharacter', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: '1a', expect: false },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorChineseCharacter);
    });

    // 请输入正确的11位手机号
    describe('validatorPhoneNumber', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: '1a', expect: false },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorPhoneNumber);
    });

    // 用户名不合法
    describe('validatorUserName', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: '1a', expect: true },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorUserName);
    });

    // 姓名不合法
    describe('validatorName', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: 'rew', expect: false },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorName);
    });

    // 密码不合法
    describe('validatorPassword', function () {
      var tests = [
        { test: { userName: '123456', password: {} }, expect: false },
        { test: { userName: '123456', password: '_' }, expect: false },
        { test: { userName: '123456', password: 1 }, expect: false },
        { test: { userName: '123456', password: '1a' }, expect: false },

        // { test: { userName: '123456', password: '123456' }, expect: false },
      ];

      _tests2(tests, zxutil.validatorPassword);
    });

    // 公司名不合法
    describe('validatorCompanyName', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: 'tt', expect: true },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorCompanyName);
    });

    // 公司简称不合法
    describe('validatorCompanyAbbr', function () {
      var tests = [
        { test: {}, expect: false },
        { test: '_', expect: false },
        { test: 1, expect: false },
        { test: 'tt', expect: true },
        { test: 's', expect: false },
      ];

      _tests(tests, zxutil.validatorCompanyAbbr);
    });

    describe('writeLog', function () {
      it('should can write', function () {
        zxutil.writeLog('test', 'test', {}, {});
      });
    });
  });
}
