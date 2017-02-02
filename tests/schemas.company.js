/* jshint
   node: true, devel: true, maxstatements: 14, maxparams: 3,
   maxerr: 50, nomen: true, regexp: true
 */

/* globals describe, it, after */

/**
 * schemas/company.js - Mocha schemas/company test
 * require: app/schemas/company, app/conn
 */
'use strict';

if (require('./testconf').schemasCompany) {
  describe('schemas/company.js', function () {
    var assert = require('assert');
    var SchemaCompany = require('../src/app/schemas/company');

    var dbHost = process.env.DB_HOST_TEST;
    var Conn = require('../src/app/conn')(dbHost, 'auth');
    var Company = Conn.model('Company', SchemaCompany);

    var companyObj = {
      name: 'testCompany',
      tel: '8888',
      city: '深圳',
    };
    var cid;

    describe('pre save', function () {
      it('isNew createAt === updateAt', function (done) {
        var newCompany = new Company(companyObj);

        newCompany.save(function (err, company) {
          assert.strictEqual(err, null);
          assert.strictEqual(company.meta.createAt.valueOf(),
              company.meta.updateAt.valueOf());
          cid = company._id;
          done();
        });
      });

      it('!isNew createAt < updateAt', function (done) {
        Company.findOne({ _id: cid }, function (err, company) {
          assert.strictEqual(err, null);
          company.save(function (err, company) {
            assert.strictEqual(err, null);
            assert(company.meta.createAt.valueOf() <
                company.meta.updateAt.valueOf());
            done();
          });
        });
      });
    });

    // describe('statics', function () {
    //   it('findOneById', function (done) {
    //     Company.findOneById(cid, function (err, company) {
    //       assert.strictEqual(err, null);
    //       assert.strictEqual(company.tel, companyObj.tel);
    //       done();
    //     });
    //   });

    //   it('findOneByName', function (done) {
    //     Company.findOneByName(companyObj.name, function (err, company) {
    //       assert.strictEqual(err, null);
    //       assert.strictEqual(company.tel, companyObj.tel);
    //       done();
    //     });
    //   });
    // });

    after(function (done) {
      Company.remove({ _id: cid }, function () {
        done();
      });
    });
  });
}
