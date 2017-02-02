/* jshint
   node: true, devel: true, maxstatements: 32, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, before, it, after */

/* controllers/user.js - Mocha controllers/user test */
'use strict';

if (require('./testconf').controllersUser) {
  describe('controllers/user.js', function () {
    var assert = require('assert');
    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'auth');
    var ConnSz = require('../src/app/conn')(dbHost, 'sz');
    var SchemaCompany = require('../src/app/schemas/company');
    var SchemaUser = require('../src/app/schemas/user');
    var SchemaFeesTemp = require('../src/app/schemas/feestemp');
    var CompanyModel = Conn.model('Company', SchemaCompany);
    var UserModel = Conn.model('User', SchemaUser);
    var FeestempModel = ConnSz.model('Feestemp', SchemaFeesTemp);

    var createCtrl = require('../src/app/controllers/user');
    var User = createCtrl(dbHost, 'sz');

    // methods
    var _test;
    var _tests;

    _test = function (test, func) {
      it('success === ' + test.success, function (done) {
        func(test.obj, function (results) {
          assert.strictEqual(results.success, test.success);
          done();
        });
      });
    };

    _tests = function (tests, func) {
      tests.forEach(function (test) {
        _test(test, func);
      });
    };

    describe('group global', function () {
      it('count === 0', function (done) {
        CompanyModel.count({}, function (err, len) {
          assert.strictEqual(err, null);
          assert.strictEqual(len, 0);
          done();
        });
      });

      it('count === 0', function (done) {
        CompanyModel.count({ name: 'test' }, function (err, len) {
          assert.strictEqual(err, null);
          assert.strictEqual(len, 0);
          done();
        });
      });

      it('find should []', function (done) {
        CompanyModel.find({}, function (err, companys) {
          assert.strictEqual(err, null);
          assert.strictEqual(JSON.stringify(companys), '[]');
          done();
        });
      });

      it('find should []', function (done) {
        CompanyModel.find({ name: 'ee' }, function (err, companys) {
          assert.strictEqual(err, null);
          assert.strictEqual(JSON.stringify(companys), '[]');
          done();
        });
      });

      it('findOne should null', function (done) {
        CompanyModel.findOne({ name: 'dd' }, function (err, company) {
          assert.strictEqual(err, null);
          assert.strictEqual(company, null);
          done();
        });
      });

      it('update should err', function (done) {
        CompanyModel.update(
          { _id: {} },
          { $set: { feestemp: 'small' } },
          function (err, isOk) {
            assert.strictEqual(err.name, 'CastError');
            assert.strictEqual(isOk.ok, 0);
            done();
          }
        );
      });

      it('update should 1', function (done) {
        CompanyModel.update(
          { _id: undefined },
          { $set: { feestemp: 'small' } },
          function (err, isOk) {
            assert.strictEqual(err, null);
            assert.strictEqual(isOk.ok, 1);
            done();
          }
        );
      });
    });

    // 10602 10604 10902 10002 10004 10006 10904 10008
    describe('group login tests', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObj = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj, userObj: userObj },
          function (results) {
            regUser = results.user;
            done();
          }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      describe('_comparePassword', function () {
        it('success === 10904', function (done) {
          User._comparePassword({ user: regUser, password: {} },
            function (results) {
              assert.strictEqual(results.success, '10904');
              done();
            }
          );
        });
      });

      describe('_userFindOneBySearch', function () {
        var tests = [
          { obj: { search: { userName: {} } }, success: '10902' },
          { obj: { search: { userName: 'nobody' } }, success: '10006' },
        ];

        _tests(tests, User._userFindOneBySearch);
      });

      describe('login', function () {
        var userObj10602 = { userName: {} };
        var userObj10604 = { userName: 'ee', password: {} };
        var userObj10001v2v4 = {
          userName: 'test', password: '123456',
        };

        var tests = [
          { obj: userObj10602, success: '10602' },
          { obj: userObj10604, success: '10604' },
          { obj: userObj10001v2v4, success: '10004' },
        ];

        _tests(tests, User.login);

        // 改变 status
        it('success === 1', function (done) {
          UserModel.update(
            { _id: regUser._id.toString() },
            { $set: { status: true } },
            function (err) {
              assert.strictEqual(err, null);
              User.login(userObj10001v2v4, function (results) {
                assert.strictEqual(results.success, 1);
                done();
              });
            }
          );
        });

        it('success === 10008', function (done) {
          User.login(
            { userName: 'test', password: '1234567' },
            function (results) {
              assert.strictEqual(results.success, '10008');
              done();
            }
          );
        });

        // 改变 role
        it('success === 10002', function (done) {
          UserModel.update(
            { _id: regUser._id.toString() },
            { $set: { role: 0 } },
            function (err) {
              assert.strictEqual(err, null);
              User.login(userObj10001v2v4, function (results) {
                assert.strictEqual(results.success, '10002');
                done();
              });
            }
          );
        });
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            done();
          });
        });
      });
    });

    // 10612 10614
    describe('group initUser tests', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObj = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj, userObj: userObj },
          function (results) {
            regUser = results.user;
            done();
          }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      describe('initUser', function () {
        it('success === 10612', function (done) {
          var obj10612 = { uid: regUser._id.toString(), dbName: 'gfz' };
          User.initUser(obj10612, function (results) {
            assert.strictEqual(results.success, '10612');
            done();
          });
        });

        it('success === 1', function (done) {
          var obj1 = { uid: regUser._id.toString(), dbName: 'gz' };
          UserModel.update(
            { _id: regUser._id.toString() },
            { $set: { status: true } },
            function (err) {
              assert.strictEqual(err, null);
              User.initUser(obj1, function (results) {
                assert.strictEqual(results.success, 1);
                done();
              });
            }
          );
        });

        it('success === 10614', function (done) {
          var obj10614 = { uid: regUser._id.toString(), dbName: 'gz' };
          CompanyModel.update(
            { _id: regUser.company.toString() },
            { $set: { category: 30 } },
            function (err) {
              assert.strictEqual(err, null);
              User.initUser(obj10614, function (results) {
                assert.strictEqual(results.success, '10614');
                done();
              });
            }
          );
        });
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            done();
          });
        });
      });
    });

    // 10622 10624 10626 10628 10630 10632
    // 10922 10022 10924 10024 10926 10928
    describe('group register tests', function () {
      var companyObjOne = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObjOne = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };

      before(function (done) {
        User.register({ companyObj: companyObjOne, userObj: userObjOne },
          function () { done(); }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      describe('_companyFindOneByName', function () {
        var test = {
          obj: { companyObj: { name: {} }, userObj: {} },
          success: '10922',
        };

        _test(test, User._companyFindOneByName);
      });

      describe('_userFindOneByUserName', function () {
        var userObj = { userName: {}, password: '123456' };
        var test = {
          obj: { companyObj: {}, userObj: userObj },
          success: '10924',
        };

        _test(test, User._userFindOneByUserName);
      });

      describe('_newCompanySave', function () {
        var obj = { companyObj: { name: {} }, userObj: {} };
        var test = { obj: obj, success: '10926' };

        _test(test, User._newCompanySave);
      });

      describe('_newUserSave', function () {
        var test = {
          obj: { userName: {}, password: '123456' },
          success: '10928',
        };

        _test(test, User._newUserSave);
      });

      describe('register', function () {
        var companyObj10024 = {
          name: 'testCompany1',
          city: '深圳',
        };
        var userObjTwo = {
          userName: 'test2',
          password: '123456',
          companyAbbr: 'tt',
          name: '何苗',
          phone: 11111111111,
        };
        var tests = [
          { obj: { companyObj: {} }, success: '10622' },
          { obj:
            { companyObj:
              { name: 'company' },
              userObj: {},
            },
            success: '10624',
          },
          {
            obj: {
              companyObj: { name: 'company' },
              userObj: { userName: 'user' },
            },
            success: '10626',
          },
          {
            obj: {
              companyObj: { name: 'company' },
              userObj: { userName: 'user', password: '123456' },
            },
            success: '10628',
          },
          {
            obj: {
              companyObj: { name: 'company' },
              userObj: {
                userName: 'user',
                password: '123456',
                companyAbbr: 'cp',
              },
            },
            success: '10630',
          },
          {
            obj: {
              companyObj: { name: 'company' },
              userObj: {
                userName: 'user',
                password: '123456',
                companyAbbr: 'cp',
                name: '何苗',
              },
            },
            success: '10632',
          },
          {
            obj: { companyObj: companyObjOne, userObj: userObjOne },
            success: '10022',
          },
          {
            obj: { companyObj: companyObj10024, userObj: userObjOne },
            success: '10024',
          },
          {
            obj: { companyObj: companyObj10024, userObj: userObjTwo },
            success: 1,
          },
        ];

        _tests(tests, User.register);
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            done();
          });
        });
      });
    });

    // 10642 10644 10942 10944 10646 10008
    describe('group changePassword tests', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObj = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj, userObj: userObj },
          function (results) {
            regUser = results.user;
            done();
          }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      describe('changePassword', function () {
        var obj10642 = { password: {} };
        var obj10644 = { password: '111111', passwordnew: {} };
        var obj10942 = { _id: {}, password: '111111', passwordnew: '123456' };
        var obj10646 = {
          _id: '57e39e7e88c5af0f00869e36',
          password: '111111',
          passwordnew: '123456',
        };

        var tests = [
          { obj: obj10642, success: '10642' },
          { obj: obj10644, success: '10644' },
          { obj: obj10942, success: '10942' },
          { obj: obj10646, success: '10646' },
        ];

        _tests(tests, User.changePassword);

        it('success === 10008', function (done) {
          var obj10008 = {
            _id: regUser._id.toString(),
            password: '111111',
            passwordnew: '123456',
          };

          User.changePassword(obj10008, function (results) {
            assert.strictEqual(results.success, '10008');
            done();
          });
        });

        it('success === 1', function (done) {
          var obj1 = {
            _id: regUser._id.toString(),
            password: '123456',
            passwordnew: '111111',
          };

          User.changePassword(obj1, function (results) {
            assert.strictEqual(results.success, 1);
            done();
          });
        });
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            done();
          });
        });
      });
    });

    describe('group companylist changeStatus resetPassword', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var companyObj1 = {
        name: 'testCompany1',
        city: '深圳',
      };
      var userObj = {
        userName: 'testtest',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var userObj1 = {
        userName: 'test1',
        password: '123456',
        companyAbbr: 'tt1',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj1, userObj: userObj1 },
          function () {
            User.register({ companyObj: companyObj, userObj: userObj },
              function (results) {
                var feestemp = new FeestempModel({ name: 'small' });
                regUser = results.user;
                feestemp.save(function () {

                  done();
                });
              }
            );
          }
        );
      });

      describe('config', function () {
        it('two company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 2);
            done();
          });
        });

        it('two user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 2);
            done();
          });
        });

        it('one feestemp', function (done) {
          FeestempModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      describe('companylist', function () {
        describe('_feesTempFind', function () {
          var test = { neObj: {} };

          it('should ok', function (done) {
            User._feesTempFind(test, function (result) {
              assert.strictEqual(JSON.stringify(result), '{}');
              done();
            });
          });
        });

        it('should err', function (done) {
          User.companylist({ CITY: {} }, function (result) {
            assert(JSON.stringify(result) === '{}');
            done();
          });
        });

        it('should ok', function (done) {
          User.companylist({ CITY: '深圳' }, function (result) {
            assert.strictEqual(typeof result, 'object');
            done();
          });
        });
      });

      describe('companyUpdate', function () {
        var tests = [
          { obj: { set: { feestemp: {} } }, success: '10962' },
          { obj: { set: { feestemp: 'test' } }, success: '10662' },
          { obj: { set: { name: 't' } }, success: '10664' },
          { obj: { set: { _id: {} } }, success: '10966' },
          { obj: { set: { feestemp: 'small' } }, success: '10680' },
        ];

        _tests(tests, User.companyUpdate);

        it('success === 10964', function (done) {
          User._companyFindOne({ set: { name: {} } }, function (results) {
            assert.strictEqual(results.success, '10964');
            done();
          });
        });

        it('success === 10062', function (done) {
          User.companyUpdate(
            { _id: regUser.company.toString(), set: { name: 'testCompany1' } },
            function (results) {
              assert.strictEqual(results.success, '10062');
              done();
            }
          );
        });

        it('success === 1', function (done) {
          User.companyUpdate(
            { _id: regUser.company, set: { name: 'testCompany2' } },
            function (results) {
              assert.strictEqual(results.success, 1);
              done();
            }
          );
        });
      });

      // 10970 10666 10668 10972 10682 10688
      describe('changeStatus', function () {
        it('success === 10688', function (done) {
          User.changeStatus(
            { _id: '57e694e588c5af0f0086b176', status: false },
            99,
            function (result) {
              assert.strictEqual(result.success, '10688');
              done();
            }
          );
        });

        it('success === 10668', function (done) {
          User.changeStatus(
            { _id: null, status: false },
            99,
            function (result) {
              assert.strictEqual(result.success, '10668');
              done();
            }
          );
        });

        it('success === 10970', function (done) {
          User.changeStatus(
            { _id: { a: 1 }, status: false },
            99,
            function (result) {
              assert.strictEqual(result.success, '10970');
              done();
            }
          );
        });

        it('success === 10972', function (done) {
          User._changeStatusUp({}, 30, function (result) {
            assert.strictEqual(result.success, '10972');
            done();
          });
        });

        it('success === 10682', function (done) {
          User._changeStatusUp(undefined, true, function (result) {
            assert.strictEqual(result.success, '10682');
            done();
          });
        });

        it('success === 1', function (done) {
          User.changeStatus(
            { _id: regUser._id.toString(), status: true },
            99,
            function (result) {
              assert.strictEqual(result.success, 1);
              done();
            }
          );
        });

        // resetPassword
        // category 20
        it('success === 1', function (done) {
          User.resetPassword(
            { _id: regUser._id.toString(), password: 'wwwww1' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, 1);
              done();
            }
          );
        });

        it('success === 10666', function (done) {
          CompanyModel.update(
            { _id: regUser.company },
            { category: 30 },
            function (err) {
              assert.strictEqual(err, null);
              User.changeStatus(
                { _id: regUser._id.toString(), status: true },
                10,
                function (result) {
                  assert.strictEqual(result.success, '10666');
                  done();
                }
              );
            }
          );
        });
      });

      // 10672 10974 10674 10670 10976 10690
      describe('resetPassword', function () {
        it('success === 10690', function (done) {
          User.resetPassword(
            { _id: '57e694e588c5af0f0086b176', password: 'false' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, '10690');
              done();
            }
          );
        });

        it('success === 10672', function (done) {
          User.resetPassword(
            { _id: null, password: false },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, '10672');
              done();
            }
          );
        });

        it('success === 10974', function (done) {
          User.resetPassword(
            { _id: {}, password: 'false' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, '10974');
              done();
            }
          );
        });

        it('success === 10674', function (done) {
          User.resetPassword(
            { _id: regUser._id.toString(), password: 'test' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, '10674');
              done();
            }
          );
        });

        it('success === 10674', function (done) {
          User.resetPassword(
            { _id: regUser._id.toString(), password: 'testtest' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, '10674');
              done();
            }
          );
        });

        it('success === 10670', function (done) {
          User.resetPassword(
            { _id: regUser._id.toString(), password: 'wwwwww' },
            false,
            0,
            function (result) {
              assert.strictEqual(result.success, '10670');
              done();
            }
          );
        });

        it('success === 10976', function (done) {
          User._resetPasswordSave(regUser, {}, function (result) {
            assert.strictEqual(result.success, '10976');
            done();
          });
        });

        it('success === 1', function (done) {
          User.resetPassword(
            { _id: regUser._id.toString(), password: 'wwwwww' },
            true,
            99,
            function (result) {
              assert.strictEqual(result.success, 1);
              done();
            }
          );
        });
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            FeestempModel.remove({}, function () {
              done();
            });
          });
        });
      });
    });

    describe('group list', function () {
      it('should err', function (done) {
        User.list({ company: {} }, function (result) {
          assert(JSON.stringify(result) === '[]');
          done();
        });
      });

      it('should ok', function (done) {
        User.list({}, function (result) {
          assert(JSON.stringify(result) === '[]');
          done();
        });
      });
    });

    // 10624 10626 10628 10630 10632 10024 10924
    describe('group add tests', function () {
      describe('add', function () {
        var tests = [
          { obj: {},
            success: '10624',
          },
          { obj: { userName: 'dd' },
            success: '10626',
          },
          { obj: { userName: 'dd', password: '222222' },
            success: '10628',
          },
          { obj: { userName: 'dd', password: '222222', companyAbbr: 'ee' },
            success: '10630',
          },
          { obj: {
              userName: 'dd', password: '222222',
              companyAbbr: 'ee', name: '回调',
            },
            success: '10632',
          },
          { obj: {
              userName: 'dd', password: '222222',
              companyAbbr: 'ee', name: '回调', phone: 12345678901,
            },
            success: 1,
          },
          { obj: {
              userName: 'dd', password: '222222',
              companyAbbr: 'ee', name: '回调', phone: 12345678901,
            },
            success: '10024',
          },
        ];

        _tests(tests, User.add);

        it('success === 10924', function (done) {
          User._addFindOne({ userName: {} }, function (result) {
            assert.strictEqual(result.success, '10924');
            done();
          });
        });
      });

      after(function (done) {
        UserModel.remove({}, function () {
          done();
        });
      });
    });

    // 10978 10980 10676 10678 10684
    describe('update tests', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObj = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj, userObj: userObj },
          function (results) {
            regUser = results.user;
            done();
          }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      it('success === 10980', function (done) {
        User._userUpdate({}, {}, function (results) {
          assert.strictEqual(results.success, '10980');
          done();
        });
      });

      it('success === 10684', function (done) {
        User._userUpdate(undefined, {}, function (results) {
          assert.strictEqual(results.success, '10684');
          done();
        });
      });

      it('success === 10978', function (done) {
        User.update({ _id: {} }, {}, function (results) {
          assert.strictEqual(results.success, '10978');
          done();
        });
      });

      it('success === 10676', function (done) {
        User.update(
          { _id: '57e694e588c5af0f0086b176' },
          {},
          function (results) {
            assert.strictEqual(results.success, '10676');
            done();
          }
        );
      });

      // 服务商可以修改地接社
      it('success === 10678', function (done) {
        User.update(
          { _id: regUser._id },
          { category: 30 },
          function (results) {
            assert.strictEqual(results.success, '10678');
            done();
          }
        );
      });

      // 自己可以修改自己
      it('success === 10678', function (done) {
        User.update(
          { _id: regUser._id },
          { category: 20, id: regUser._id.toString() },
          function (results) {
            assert.strictEqual(results.success, '10678');
            done();
          }
        );
      });

      // 同一公司只能修改权限比自己小的用户
      it('success === 10678 1', function (done) {
        User.update(
          { _id: regUser._id },
          { category: 20, cid: regUser.company.toString(), role: 31 },
          function (results) {
            assert.strictEqual(results.success, '10678');
            done();
          }
        );
      });

      // 服务商可以修改地接社
      it('success === 1', function (done) {
        User.update(
          { _id: regUser._id, role: 20 },
          { id: '57e694e588c5af0f0086b176', category: '30' },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // 同一公司下，自己不能改自己的 role，
      it('success === 1', function (done) {
        User.update(
          {
            _id: regUser._id,
            role: 10,

            // name: '待定',
            // phone: 12345678901,
            companyAbbr: '抵达地',
          },
          {
            cid: regUser.company.toString(),
            id: regUser._id.toString(),
            role: 30,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // 同一公司下，自己不能改自己的 role，
      it('success === 1', function (done) {
        User.update(
          {
            _id: regUser._id,
            role: 10,

            // name: '待定',
            phone: '12345678901',
            companyAbbr: '抵达地',
          },
          {
            cid: regUser.company.toString(),
            id: regUser._id.toString(),
            role: 30,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // 同一公司下，自己不能改自己的 role，
      it('success === 1', function (done) {
        User.update(
          {
            _id: regUser._id,
            role: 10,
            name: '待定',
            phone: '12345678901',
            companyAbbr: '抵达地',
          },
          {
            cid: regUser.company.toString(),
            id: regUser._id.toString(),
            role: 30,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // role=99
      it('success === 1 by super', function (done) {
        User.update(
          {
            _id: regUser._id,
            phone: '12345678999',
          },
          {
            role: 99,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // 同一公司下，只能修改权限比自己小的用户
      it('success === 1 by phone', function (done) {
        User.update(
          {
            _id: regUser._id,
            phone: '12345674444',
          },
          {
            cid: regUser.company.toString(),
            id: '57e694e588c5af0f0086b176',
            role: 31,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      // 同一公司下，只能修改到比自己小的权限
      it('success === 1', function (done) {
        User.update(
          {
            _id: regUser._id,
            role: 10,
          },
          {
            cid: regUser.company.toString(),
            id: '57e694e588c5af0f0086b176',
            role: 30,
          },
          function (results) {
            assert.strictEqual(results.success, 1);
            done();
          }
        );
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            FeestempModel.remove({}, function () {
              done();
            });
          });
        });
      });
    });

    describe('group changeUpdateAt', function () {
      var companyObj = {
        name: 'testCompany',
        city: '深圳',
      };
      var userObj = {
        userName: 'test',
        password: '123456',
        companyAbbr: 'tt',
        name: '何苗',
        phone: 11111111111,
      };
      var regUser;

      before(function (done) {
        User.register({ companyObj: companyObj, userObj: userObj },
          function (results) {
            regUser = results.user;
            done();
          }
        );
      });

      describe('config', function () {
        it('one company', function (done) {
          CompanyModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });

        it('one user', function (done) {
          UserModel.count({}, function (err, len) {
            assert.strictEqual(err, null);
            assert.strictEqual(len, 1);
            done();
          });
        });
      });

      it('success === 10999', function (done) {
        User.changeUpdateAt({}, function (results) {
          assert.strictEqual(results.success, '10999');
          done();
        });
      });

      it('success === 2', function (done) {
        User.changeUpdateAt(undefined, function (results) {
          assert.strictEqual(results.success, '2');
          done();
        });
      });

      it('success === 1', function (done) {
        User.changeUpdateAt(regUser._id, function (results) {
          assert.strictEqual(results.success, 1);
          done();
        });
      });

      it('success === ok', function (done) {
        User.changeUpdateAt(regUser._id);
        done();
      });

      after(function (done) {
        CompanyModel.remove({}, function () {
          UserModel.remove({}, function () {
            FeestempModel.remove({}, function () {
              done();
            });
          });
        });
      });
    });
  });
}
