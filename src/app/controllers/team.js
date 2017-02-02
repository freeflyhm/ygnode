/* jshint
   node: true,        devel: true,
   maxstatements: 182, maxparams: 3, maxdepth: 5,
   maxerr: 50,        nomen: true,  regexp: true
 */

/**
 * team controller 模块
 * @module app/controllers/team
 */
'use strict';

var createCtrl = function (dbHost, dbName) {
  // 24
  var _ERRS = {
    // xx9 系统级错误
    LIST_ERR_1: '24902', // 此错误不抛到客户端
    LIST_ERR_2: '24904', // 此错误不抛到客户端
    DOWNLOAD_ERR_1: '24906', // 此错误不抛到客户端
    DOWNLOAD_ERR_2: '24906', // 此错误不抛到客户端
    DOWNLOAD_ERR_3: '24908',
    DOWNLOAD_ERR_4: '24910',
    GET_TEAM_USER_ERR: '24912',
    REMOVE_ERR_1: '24914',
    REMOVE_ERR_2: '24916',
    REMOVE_ERR_3: '24918',

    GET_TEAM_USER_EXIST: '24602',

    // xx0 一般错误
    DOWNLOAD_ISOK_1: '24002',  // 此错误不抛到客户端
    DOWNLOAD_ISOK_2: '24004',  // 此错误不抛到客户端

    _ids_1: '10007',
    _ids_2: '10008',
    _batchs_1: '10009',
    _batchs_2: '10010',

    REMOVE_FAIL_1: '24012',
    REMOVE_FAIL_2: '24014',
    REMOVE_FAIL_3: '24016',
  };
  var ctrlName  = 'team';
  var mongoose  = require('mongoose');
  var moment    = require('moment');
  var iconv     = require('iconv-lite');
  var cheerio   = require('cheerio');
  var request   = require('request');
  var getModel  = require('../model');
  var zxutil    = require('../zxutil');
  var Team      = getModel(dbHost, dbName, ctrlName);
  var Company   = getModel(dbHost, 'auth', 'company');
  var Sm        = getModel(dbHost, dbName, 'sm');
  var User      = getModel(dbHost, 'auth', 'user');
  var Batch     = getModel(dbHost, dbName, 'batch');
  var Message   = getModel(dbHost, dbName, 'message');
  var getCtrl   = require('../ctrl');
  var Feestemp  = getCtrl(dbHost, dbName, 'feestemp');
  var errCode;

  // public methods
  var list;
  var getObjectIds;

  // var getTeamUser;
  var downloadTeam;
  var getTeamById;

  // 获取航班信息
  var postFlightInfo;

  var _batchsRemove;

  // var _batchsCreate;
  // var _smFindOneAndUpdate;

  var _messages;
  var _batchs;
  var _ids;
  var _returnTraffics;
  var _departureTraffics;
  var _trafficsAdd;
  var addTeam;
  var saveTeam;
  var _removeIds;
  var _removeTraffics;
  var removeTeam;

  list = function (obj, callback) {
    var LIMIT    = 20;

    var pageN    = Number(obj.n);
    var company  = obj.cid;
    var uid      = obj.uid;

    var departureDate = obj.start;
    var returnDate = obj.end;

    var index = pageN * LIMIT;
    var search1 = { user: uid };
    var search2 = { company: company };
    var search = { $or: [search1, search2] };

    if (departureDate && departureDate !== 'all') {
      search1.departureDate = moment(departureDate);
      search2.departureDate = moment(departureDate);
    }

    if (returnDate && returnDate !== 'all') {
      search1.returnDate = moment(returnDate);
      search2.returnDate = moment(returnDate);
    }

    Team.count(search, function (err, len) {
      if (err) {
        errCode = _ERRS.LIST_ERR_1;
        zxutil.writeLog(ctrlName, errCode, err, search);
        return callback({});
      }

      Team.find(
        search,
        {
          isOpen: 1, teamNum: 1, lineName: 1, teamType: 1,
          departureDate: 1, departureTraffics: 1,
          returnDate: 1, returnTraffics: 1,
          operator: 1, planNumber: 1, realNumber: 1,
          'meta.createAt': 1, isDownload: 1,
        }
      ).sort(
        { _id: -1 }
      ).skip(
        index
      ).limit(
        LIMIT
      ).populate(
        'departureTraffics',
        'flight.flightStartCity',
        { smStatus: { $gt: 0 } }
      ).populate(
        'returnTraffics',
        'flight.flightStartCity',
        { smStatus: { $gt: 0 } }
      ).exec(function (err, teams) {
        if (err) {
          errCode = _ERRS.LIST_ERR_2;
          zxutil.writeLog(ctrlName, errCode, err, obj);
          return callback({});
        }

        callback({
          teams: teams,
          totalPage: Math.ceil(len / LIMIT), // 向上取整
        });
      });
    });
  };

  getObjectIds = function (len, callback) {
    var i;
    var id;
    var ids = [];

    for (i = 0; i < len; i += 1) {
      id = new mongoose.Types.ObjectId; // jshint ignore:line
      ids.push(id);
    }

    callback(ids);
  };

  // 下载team
  downloadTeam = function (obj, callback) {
    var CITY       = obj.CITY;
    var id         = obj.id;
    var isDownload = obj.isDownload;

    Team
      .findOne({ _id: id })
      .populate('departureTraffics')
      .populate('returnTraffics')
      .populate('users.batchs')
      .exec(function (err, team) {
        var ids;
        var isShowBatchs;
        var sn;
        var users;
        var j;
        var lenJ;
        var teamUser;
        var user;
        var batchs;
        var i;
        var lenI;
        var teamUserBatch;
        var batch;
        var batchSpanArr1;
        var batchSpanArr2;
        var batchSpan;
        var batchSpan1;
        var batchSpan2;
        var batchInfo;
        var teamUserBatchPerson;
        var persons;
        var k;
        var lenK;
        var person;
        var departureArr;
        var returnArr;
        var flightDate;
        var flightTime;
        var setData;

        if (err) {
          errCode = _ERRS.DOWNLOAD_ERR_3;
          zxutil.writeLog(ctrlName, errCode, err, obj);
          return callback({ success: errCode });
        }

        if (team) {
          isShowBatchs = true; // 是否需要在航班信息中显示组
          if (team.users.length === 0) {
            isShowBatchs = false;

            // 即使更新出错了，依然 setData
            if (isDownload === false) {
              Team.update({ _id: id },
                  { $set: { isDownload: true } }, function (err, isOk) {
                if (err) {
                  errCode = _ERRS.DOWNLOAD_ERR_1;
                  zxutil.writeLog(ctrlName, errCode, err, obj);
                }

                if (!(isOk.nModified === 1 && isOk.n === 1)) {
                  errCode = _ERRS.DOWNLOAD_ISOK_1;
                  zxutil.writeLog(ctrlName, errCode, {}, obj);
                }
              });
            }

            sn = 0;
            users = [];
            for (j = 0, lenJ = team.users.length; j < lenJ; j += 1) {
              teamUser = team.users[j];
              user = {};
              batchs = [];

              user.userName = teamUser._id.name;
              user.phone = teamUser._id.phone;
              lenI = teamUser.batchs.length;
              for (i = 0; i < lenI; i += 1) {
                teamUserBatch = teamUser.batchs[i];
                batch = {};
                batchSpanArr1 = [];
                batchSpanArr2 = [];
                batchSpan = '';
                batchSpan1 = '';
                batchSpan2 = '';

                if (teamUserBatch.departureTraffic.smType &&
                    teamUserBatch.departureTraffic.isSm) {
                  batchSpanArr2.push(teamUserBatch.departureTraffic.smType);
                }

                if (teamUserBatch.returnTraffic.smType &&
                    teamUserBatch.returnTraffic.isSm) {
                  batchSpanArr2.push(teamUserBatch.returnTraffic.smType);
                }

                batchSpan1 = batchSpanArr1.join('');
                batchSpan2 = batchSpanArr2.join('');
                batchSpan1 = batchSpan1 === '' ? '' : '-' + batchSpan1;
                batchSpan2 = batchSpan2 === '' ? '' : '-' + batchSpan2;
                batchSpan = batchSpan1 + batchSpan2;

                batch.batchNum = teamUserBatch.batchNum;

                batchInfo = [];
                if (teamUserBatch.guest !== '') {
                  batchInfo.push({ item: '收客:' + teamUserBatch.guest });
                }

                if (teamUserBatch.teamBatchNote !== '') {
                  batchInfo.push({ item: '备注:' + teamUserBatch.teamBatchNote });
                }

                batch.batchInfo = batchInfo;

                teamUserBatchPerson = teamUserBatch.persons[0];

                sn += 1;
                batch.sn = sn;
                batch.name = teamUserBatchPerson.name;
                batch.cardNum = teamUserBatchPerson.cardNum;
                batch.phone = teamUserBatchPerson.phone;
                batch.birthday = teamUserBatchPerson.birthday.replace(/-/g, '');
                batch.sex = teamUserBatchPerson.sex;
                batch.cardCategory = teamUserBatchPerson.cardCategory;
                batch.age =
                  teamUserBatchPerson.age === 0 ? '' : teamUserBatchPerson.age;
                batch.ageType = teamUserBatchPerson.ageType;
                batch.room = teamUserBatchPerson.room;
                batch.teamPersonNote = teamUserBatchPerson.teamPersonNote;

                persons = [];
                lenK = teamUserBatch.persons.length;
                for (k = 1; k < lenK; k += 1) {
                  teamUserBatchPerson = teamUserBatch.persons[k];
                  person = {};
                  sn += 1;
                  person.sn = sn;
                  person.name = teamUserBatchPerson.name;
                  person.cardNum = teamUserBatchPerson.cardNum;
                  person.phone = teamUserBatchPerson.phone;
                  person.birthday =
                    teamUserBatchPerson.birthday.replace(/-/g, '');
                  person.sex = teamUserBatchPerson.sex;
                  person.cardCategory = teamUserBatchPerson.cardCategory;
                  person.age =
                    teamUserBatchPerson.age ===
                      0 ? '' : teamUserBatchPerson.age;
                  person.ageType = teamUserBatchPerson.ageType;
                  person.room = teamUserBatchPerson.room;
                  person.teamPersonNote = teamUserBatchPerson.teamPersonNote;
                  persons.push(person);
                }

                batch.len = teamUserBatch.persons.length;
                batch.batchSpan = batchSpan;
                batch.persons = persons;
                batchs.push(batch);
              }

              user.batchs = batchs;
              users.push(user);
            }

            departureArr = [];
            lenJ = team.departureTraffics.length;
            for (j = 0; j < lenJ; j += 1) {
              flightDate = '';
              flightTime = '';
              if (team.departureTraffics[j].flight.flightDate) {
                flightDate =
                  moment(team.departureTraffics[j].flight.flightDate)
                    .format('YYYY-MM-DD');
              }

              if (team.departureTraffics[j].flight.flightStartTime &&
                  team.departureTraffics[j].flight.flightEndTime) {
                flightTime =
                  moment(team.departureTraffics[j].flight.flightStartTime)
                  .format('HH:mm') + '-' +
                  moment(team.departureTraffics[j].flight.flightEndTime)
                  .format('HH:mm');
              }

              departureArr.push({
                num: j + 1,
                smType: team.departureTraffics[j].smType,
                flightDate: flightDate,
                flightNum: team.departureTraffics[j].flight.flightNum,
                flightCity: team.departureTraffics[j].flight.flightStartCity +
                  '-' + team.departureTraffics[j].flight.flightEndCity,
                flightTime: flightTime,
                departureUsers: team.departureTraffics[j].departureUsers,
              });
            }

            returnArr = [];
            for (j = 0, lenJ = team.returnTraffics.length; j < lenJ; j += 1) {
              flightDate = '';
              flightTime = '';
              if (team.returnTraffics[j].flight.flightDate) {
                flightDate =
                  moment(team.returnTraffics[j].flight.flightDate)
                  .format('YYYY-MM-DD');
              }

              if (team.returnTraffics[j].flight.flightStartTime &&
                  team.returnTraffics[j].flight.flightEndTime) {
                flightTime =
                  moment(team.returnTraffics[j].flight.flightStartTime)
                  .format('HH:mm') + '-' +
                  moment(team.returnTraffics[j].flight.flightEndTime)
                  .format('HH:mm');
              }

              returnArr.push({
                num: j + 1,
                smType: team.returnTraffics[j].smType,
                flightDate: flightDate,
                flightNum: team.returnTraffics[j].flight.flightNum,
                flightCity: team.returnTraffics[j].flight.flightStartCity +
                  '-' + team.returnTraffics[j].flight.flightEndCity,
                flightTime: flightTime,
                returnUsers: team.returnTraffics[j].returnUsers,
              });
            }

            setData = {};

            setData.companyAbbr = team.companyAbbr;
            setData.name = team.name;
            setData.createAt =
              moment(team.meta.createAt).format('YYYY-MM-DD');

            setData.teamNum = team.teamNum;
            setData.lineName = team.lineName;
            setData.operator = team.operator;
            setData.teamType = team.teamType;
            setData.planNumber = team.planNumber;
            setData.realNumber = team.realNumber;

            setData.teamNote = zxutil.delHtml(team.teamNote);

            setData.smFlag = team.smFlag;
            setData.sendDriver = team.sendDriver;
            setData.meetDriver = team.meetDriver;

            setData.sendDestinationFlag = team.sendDestinationFlag;
            setData.guide = team.guide;

            setData.departureTraffics = departureArr;
            setData.returnTraffics = returnArr;

            setData.users = users;

            callback({
              success: 1,
              setData: setData,
            });
          } else {
            team = team._doc;

            ids = team.users.map(function (item) {
              return item._id;
            });

            User.find({ _id: { $in: ids } }, function (err, users) {
              var usersObj = {};
              var usersArr = [];
              var ii;
              var lenII;
              var smId;
              var flightStartCity;
              var flightEndCity;
              var smType;
              var departureUsers;
              var batchsArr;
              var returnUsers;

              if (err) {
                errCode = _ERRS.DOWNLOAD_ERR_4;
                zxutil.writeLog(ctrlName, errCode, err, obj);
                return callback({ success: errCode });
              }

              if (users) {
                for (ii = 0, lenII = users.length; ii < lenII; ii += 1) {
                  usersObj[users[ii]._id] = users[ii];
                }

                for (ii = 0, lenII = team.users.length; ii < lenII; ii += 1) {
                  usersArr.push({
                    batchs: team.users[ii].batchs,
                    _id: usersObj[team.users[ii]._id],
                  });
                }

                team.users = usersArr;

                for (i = 0; i < team.departureTraffics.length; i += 1) {
                  smId = team.departureTraffics[i]._id;
                  flightStartCity =
                    team.departureTraffics[i].flight.flightStartCity;
                  flightEndCity =
                    team.departureTraffics[i].flight.flightEndCity;
                  smType = '';

                  team.departureTraffics[i].smType = '';
                  if (flightStartCity === CITY) {
                    smType = '送';
                    if (team.departureTraffics[i].smStatus > 0) {
                      team.departureTraffics[i].smType = smType;
                    }
                  } else if (flightEndCity.indexOf(CITY) === 0) {
                    smType = '接';
                    if (team.departureTraffics[i].smStatus > 0) {
                      team.departureTraffics[i].smType = smType;
                    }
                  }

                  departureUsers = [];
                  for (j = 0; j < team.users.length; j += 1) {
                    batchs = team.users[j].batchs;
                    batchsArr = [];
                    for (k = 0; k < batchs.length; k += 1) {
                      if (batchs[k].departureTraffic._id &&
                          batchs[k].departureTraffic._id.toString() ===
                            smId.toString()) {
                        batchs[k].departureTraffic.num = i + 1;
                        batchs[k].departureTraffic.smType = smType;
                        batchsArr.push(batchs[k].batchNum + '组');
                      }
                    }

                    if (batchsArr.length > 0) {
                      departureUsers.push({
                        name: team.users[j]._id.name,
                        batchsStr: batchsArr.join(','),
                      });
                    }
                  }

                  team.departureTraffics[i].departureUsers = departureUsers;
                }

                for (i = 0; i < team.returnTraffics.length; i += 1) {
                  smId = team.returnTraffics[i]._id;
                  flightStartCity =
                    team.returnTraffics[i].flight.flightStartCity;
                  flightEndCity = team.returnTraffics[i].flight.flightEndCity;
                  smType = '';

                  team.returnTraffics[i].smType = '';
                  if (flightStartCity === CITY) {
                    smType = '送';
                    if (team.returnTraffics[i].smStatus > 0) {
                      team.returnTraffics[i].smType = smType;
                    }
                  } else if (flightEndCity.indexOf(CITY) === 0) {
                    smType = '接';
                    if (team.returnTraffics[i].smStatus > 0) {
                      team.returnTraffics[i].smType = smType;
                    }
                  }

                  returnUsers = [];
                  for (j = 0; j < team.users.length; j += 1) {
                    batchs = team.users[j].batchs;
                    batchsArr = [];
                    for (k = 0; k < batchs.length; k += 1) {
                      if (batchs[k].returnTraffic._id &&
                          batchs[k].returnTraffic._id.toString() ===
                          smId.toString()) {
                        batchs[k].returnTraffic.num = i + 1;
                        batchs[k].returnTraffic.smType = smType;
                        batchsArr.push(batchs[k].batchNum + '组');
                      }
                    }

                    if (batchsArr.length > 0) {
                      returnUsers.push({
                        name: team.users[j]._id.name,
                        batchsStr: batchsArr.join(','),
                      });
                    }
                  }

                  team.returnTraffics[i].returnUsers = returnUsers;
                }

                if (isDownload === false) {
                  Team.update({ _id: id },
                    { $set: { isDownload: true } }, function (err, isOk) {
                    if (err) {
                      errCode = _ERRS.DOWNLOAD_ERR_2;
                      zxutil.writeLog(ctrlName, errCode, err, obj);
                    }

                    if (!(isOk.nModified === 1 && isOk.n === 1)) {
                      errCode = _ERRS.DOWNLOAD_ISOK_2;
                      zxutil.writeLog(ctrlName, errCode, {}, obj);
                    }
                  });
                }

                sn = 0;
                users = [];
                for (j = 0, lenJ = team.users.length; j < lenJ; j += 1) {
                  teamUser = team.users[j];
                  user = {};
                  batchs = [];

                  user.userName = teamUser._id.name;
                  user.phone = teamUser._id.phone;
                  for (i = 0, lenI = teamUser.batchs.length; i < lenI; i += 1) {
                    teamUserBatch = teamUser.batchs[i];
                    batch = {};
                    batchSpanArr1 = [];
                    batchSpanArr2 = [];
                    batchSpan = '';
                    batchSpan1 = '';
                    batchSpan2 = '';

                    if (teamUserBatch.departureTraffic.smType &&
                        teamUserBatch.departureTraffic.isSm) {
                      batchSpanArr2.push(teamUserBatch.departureTraffic.smType);
                    }

                    if (teamUserBatch.returnTraffic.smType &&
                        teamUserBatch.returnTraffic.isSm) {
                      batchSpanArr2.push(teamUserBatch.returnTraffic.smType);
                    }

                    batchSpan1 = batchSpanArr1.join('');
                    batchSpan2 = batchSpanArr2.join('');
                    batchSpan1 = batchSpan1 === '' ? '' : '-' + batchSpan1;
                    batchSpan2 = batchSpan2 === '' ? '' : '-' + batchSpan2;
                    batchSpan = batchSpan1 + batchSpan2;

                    batch.batchNum = teamUserBatch.batchNum;

                    batchInfo = [];
                    if (teamUserBatch.guest !== '') {
                      batchInfo.push({ item: '收客:' + teamUserBatch.guest });
                    }

                    if (teamUserBatch.teamBatchNote !== '') {
                      batchInfo.push(
                        { item: '备注:' + teamUserBatch.teamBatchNote }
                      );
                    }

                    batch.batchInfo = batchInfo;

                    teamUserBatchPerson = teamUserBatch.persons[0];

                    sn += 1;
                    batch.sn = sn;
                    batch.name = teamUserBatchPerson.name;
                    batch.cardNum = teamUserBatchPerson.cardNum;
                    batch.phone = teamUserBatchPerson.phone;
                    batch.birthday =
                      teamUserBatchPerson.birthday.replace(/-/g, '');
                    batch.sex = teamUserBatchPerson.sex;
                    batch.cardCategory = teamUserBatchPerson.cardCategory;
                    batch.age =
                      teamUserBatchPerson.age ===
                        0 ? '' : teamUserBatchPerson.age;
                    batch.ageType = teamUserBatchPerson.ageType;
                    batch.room = teamUserBatchPerson.room;
                    batch.teamPersonNote = teamUserBatchPerson.teamPersonNote;

                    persons = [];
                    lenK = teamUserBatch.persons.length;
                    for (k = 1; k < lenK; k += 1) {
                      teamUserBatchPerson = teamUserBatch.persons[k];
                      person = {};
                      sn += 1;
                      person.sn = sn;
                      person.name = teamUserBatchPerson.name;
                      person.cardNum = teamUserBatchPerson.cardNum;
                      person.phone = teamUserBatchPerson.phone;
                      person.birthday =
                        teamUserBatchPerson.birthday.replace(/-/g, '');
                      person.sex = teamUserBatchPerson.sex;
                      person.cardCategory = teamUserBatchPerson.cardCategory;
                      person.age =
                        teamUserBatchPerson.age ===
                          0 ? '' : teamUserBatchPerson.age;
                      person.ageType = teamUserBatchPerson.ageType;
                      person.room = teamUserBatchPerson.room;
                      person.teamPersonNote =
                        teamUserBatchPerson.teamPersonNote;
                      persons.push(person);
                    }

                    batch.len = teamUserBatch.persons.length;
                    batch.batchSpan = batchSpan;
                    batch.persons = persons;
                    batchs.push(batch);
                  }

                  user.batchs = batchs;
                  users.push(user);
                }

                departureArr = [];
                lenJ = team.departureTraffics.length;
                for (j = 0; j < lenJ; j += 1) {
                  flightDate = '';
                  flightTime = '';
                  if (team.departureTraffics[j].flight.flightDate) {
                    flightDate =
                      moment(team.departureTraffics[j].flight.flightDate)
                      .format('YYYY-MM-DD');
                  }

                  if (team.departureTraffics[j].flight.flightStartTime &&
                      team.departureTraffics[j].flight.flightEndTime) {
                    flightTime =
                      moment(team.departureTraffics[j].flight.flightStartTime)
                      .format('HH:mm') + '-' +
                      moment(team.departureTraffics[j].flight.flightEndTime)
                      .format('HH:mm');
                  }

                  departureArr.push({
                    num: j + 1,
                    smType: team.departureTraffics[j].smType,
                    flightDate: flightDate,
                    flightNum: team.departureTraffics[j].flight.flightNum,
                    flightCity:
                      team.departureTraffics[j].flight.flightStartCity +
                      '-' + team.departureTraffics[j].flight.flightEndCity,
                    flightTime: flightTime,
                    departureUsers: team.departureTraffics[j].departureUsers,
                  });
                }

                returnArr = [];
                lenJ = team.returnTraffics.length;
                for (j = 0; j < lenJ; j += 1) {
                  flightDate = '';
                  flightTime = '';
                  if (team.returnTraffics[j].flight.flightDate) {
                    flightDate =
                      moment(team.returnTraffics[j].flight.flightDate)
                      .format('YYYY-MM-DD');
                  }

                  if (team.returnTraffics[j].flight.flightStartTime &&
                      team.returnTraffics[j].flight.flightEndTime) {
                    flightTime =
                      moment(team.returnTraffics[j].flight.flightStartTime)
                      .format('HH:mm') + '-' +
                      moment(team.returnTraffics[j].flight.flightEndTime)
                      .format('HH:mm');
                  }

                  returnArr.push({
                    num: j + 1,
                    smType: team.returnTraffics[j].smType,
                    flightDate: flightDate,
                    flightNum: team.returnTraffics[j].flight.flightNum,
                    flightCity: team.returnTraffics[j].flight.flightStartCity +
                      '-' + team.returnTraffics[j].flight.flightEndCity,
                    flightTime: flightTime,
                    returnUsers: team.returnTraffics[j].returnUsers,
                  });
                }

                setData = {};

                setData.companyAbbr = team.companyAbbr;
                setData.name = team.name;
                setData.createAt =
                  moment(team.meta.createAt).format('YYYY-MM-DD');

                setData.teamNum = team.teamNum;
                setData.lineName = team.lineName;
                setData.operator = team.operator;
                setData.teamType = team.teamType;
                setData.planNumber = team.planNumber;
                setData.realNumber = team.realNumber;

                setData.teamNote   = zxutil.delHtml(team.teamNote);

                setData.smFlag = team.smFlag;
                setData.sendDriver = team.sendDriver;
                setData.meetDriver = team.meetDriver;

                setData.sendDestinationFlag = team.sendDestinationFlag;
                setData.guide = team.guide;

                setData.departureTraffics = departureArr;
                setData.returnTraffics = returnArr;

                setData.users = users;

                callback({
                  success: 1,
                  setData: setData,
                });
              }
            });
          }
        }
      });
  };

  // get 团队单详情页 -getTeamById
  getTeamById = function (obj, callback) {
    Team.findOne({ _id: obj.id })
      .populate('departureTraffics')
      .populate('returnTraffics')
      .populate('users.batchs')
      .exec(function (err, team) {
        var ids;

        if (err) { console.log(err); }

        if (team) {
          // if (team.users.length === 0) {
          //   callback(team);
          // } else {
          ids = team.users.map(function (item) {
            return item._id;
          });

          User.find(
            { _id: { $in: ids } },
            { password: 0 },
            function (err, users) {
              var userObj = {};
              var userArr = [];
              var _doc;

              if (err) { console.log(err); }

              if (users) {
                users.forEach(function (item) {
                  userObj[item._id] = item;
                });

                team.users.forEach(function (item) {
                  userArr.push({
                    batchs: item.batchs,
                    _id: userObj[item._id],
                  });
                });

                Company.findOne(
                  { _id: team.company },
                  { feestemp: 1 },
                  function (err, company) {
                    if (err) { console.log(err); }

                    if (company) {
                      Feestemp.getMyFeestemp(
                        { feestemp:  company.feestemp },
                        function (myfeestemp) {
                          if (err) { console.log(err); }

                          _doc = team._doc;
                          _doc.users = userArr;
                          callback({
                            team: _doc,
                            myfeestemp: myfeestemp,
                          });
                        }
                      );
                    }
                  }
                );

              }
            }
          );

          // }
        }
      }
    );
  };

  // 业务逻辑转移到客户端
  // 这里改为只做简单过滤后转发
  // 减轻服务器压力

  // callback({
  //   success: 1,
  //   source: 1,
  //   body: {
  //     error_code: 0,
  //     result: {
  //       info: {
  //         from: '',
  //         to: '',
  //         qftime: '',
  //         ddtime: '',
  //       },
  //       list: [
  //         {
  //           qf: '', // kb
  //           dd: '', // kb
  //           zjgt: '', // kb
  //           djk: '', // kb
  //           state: '', // kb
  //           jhqftime: '', //
  //           jhddtime: '', //
  //           yjqftime: '', //
  //           yjddtime: '', //
  //           sjqftime: '', //
  //           sjddtime: '', //
  //         },
  //       ],
  //     },
  //   },
  // });
  postFlightInfo = function (obj, callback) {
    var flightNum = obj.flightNum;
    var flightDate = obj.flightDate;

    // 聚合数据 慢！！！
    // 请求地址：http://apis.juhe.cn/plan/snew
    // 请求参数：name=ZH9981&date=2016-10-01&dtype=&key=4ebfb6d8b4603b42fdb094172cb8bc46
    // 请求方式：GET

    // 错误码 说明
    // 202001  航班号不能为空
    // 202002  查询不到结果
    // 202003  出发城市和到达城市不能为空
    // 202004  错误的出发城市或到达城市

    // {
    //   "resultcode":"202",
    //   "reason":"查询不到该航班的信息2",
    //   "result":null,
    //   "error_code":202002
    // }
    var url = 'http://apis.juhe.cn/plan/snew?name=' + flightNum +
      '&date=' + flightDate + '&key=4ebfb6d8b4603b42fdb094172cb8bc46';

    var _getUrl = function (error, response, body) {
      if (body) {
        callback({
          success: 1,
          source: 2,
          body: body,
        });
      } else {
        callback({ success: 2 });
      }
    };

    // 携程
    var flightDate1 = flightDate.replace(/-/g, '');
    var options1 = {
      url: 'http://flights.ctrip.com/actualtime/fno--' +
        flightNum + '-' + flightDate1 + '.html',
      encoding: null,
      headers: {
        Accept: 'text/html, application/xhtml+xml, */*',
        'Accept-Language': 'zh-Hans-CN,zh-Hans;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64; ' +
          'Trident/7.0; rv:11.0) like Gecko/20100101 Firefox/22.0',
        Host: 'flights.ctrip.com',
        DNT: '1',
        Connection: 'Keep-Alive',
        'Cache-Control': 'no-cache',
      },
    };

    var getUrl1 = function (error, response, body) {
      var $;
      var $detailInfo;

      if (!error && response.statusCode === 200) {
        body = iconv.decode(body, 'gb2312');  //转码
        $ = cheerio.load(body, { decodeEntities: false });
        $detailInfo = $('.detail-box').find('.detail-info');

        var _t = function (str) {
          var re = /(([01][0-9])|(2[0-3])):[0-5][0-9]/;
          return str.match(re)[0];
        };

        var _getTime = function (item, $time3P, type) {
          var isOk = false;
          var jhTime = '';
          var time3P0Text = $time3P.eq(0).text();

          if (time3P0Text.substr(0, 2) === '计划') {
            var time3P1Text = $time3P.eq(1).text();
            if (time3P1Text && time3P1Text.indexOf('待定') === -1) {
              jhTime = _t(time3P1Text);
              isOk = true;
            }

            item['jh' + type + 'time'] = jhTime;
          } else {
            if (time3P0Text.substr(0, 2) === '预计') {
              item['yj' + type + 'time'] = $time3P.eq(1).text();
            } else {
              item['sj' + type + 'time'] = $time3P.eq(1).text();
            }

            var time3P2Text = $time3P.eq(2).text();

            if (time3P2Text && time3P2Text.indexOf('待定') === -1) {
              jhTime = _t(time3P2Text);
              isOk = true;
            }

            item['jh' + type + 'time'] = jhTime;
          }

          return isOk;
        };

        var _getItem = function ($detail) {
          var item = {
            qf: '', // kb
            dd: '', // kb
            zjgt: '', // kb
            djk: '', // kb
            state: '', // kb
            jhqftime: '', //
            jhddtime: '', //
            yjqftime: '', //
            yjddtime: '', //
            sjqftime: '', //
            sjddtime: '', //
          };

          var $detailFly = $detail.find('.detail-fly').eq(0);
          var $startTime3P = $detailFly.find('.inl.departure > p');
          var $endTime3P = $detailFly.find('.inl.arrive > p');

          var isOk1 = _getTime(item, $startTime3P, 'qf');
          var isOk2 = _getTime(item, $endTime3P, 'dd');

          if (isOk1 && isOk2) {
            var $detailRoute = $detail.find('.detail-fly.detail-route');
            var $departure = $detailRoute.find('.inl.departure');
            var $arrive = $detailRoute.find('.inl.arrive');
            var $operationItems = $detail.find('.operation .item');

            item.qf = $departure.find('p').text();
            item.dd = $arrive.find('p').text();
            item.state = $detailFly.find('.inl.between').text();
            item.zjgt = $operationItems.eq(0).find('.m').text();
            item.djk = $operationItems.eq(1).find('.m').text();

            return item;
          }

          return null;
        };

        var _getCtripBody = function () {
          var list = [];

          var item0 = _getItem($detailInfo.eq(0));
          if (item0) {
            list.push(item0);
            if ($detailInfo.length > 1) {
              // 经停
              var item1 = _getItem($detailInfo.eq(1));
              if (item1) {
                list.push(item1);

                return {
                  error_code: 0,
                  result: {
                    info: {
                      from: list[0].qf,
                      to: list[1].dd,
                      qftime: list[0].jhqftime,
                      ddtime: list[1].jhddtime,
                    },
                    list: list,
                  },
                };
              } else {
                return { error_code: 1 };
              }
            } else {
              return {
                error_code: 0,
                result: {
                  info: {
                    from: list[0].qf,
                    to: list[0].dd,
                    qftime: list[0].jhqftime,
                    ddtime: list[0].jhddtime,
                  },
                  list: list,
                },
              };
            }
          } else {
            return { error_code: 1 };
          }
        };

        if ($detailInfo) {
          var _body = _getCtripBody($detailInfo);
          if (_body.error_code === 0) {
            callback({
              success: 1,
              source: 1,
              body: _body,
            });
          } else {
            request.get({ url: url, json: true }, _getUrl);
          }
        } else {
          // request.get({url: url_3, json: true}, getUrl_3);
          // 聚合
          request.get({ url: url, json: true }, _getUrl);
        }
      } else {
        // request.get({url: url_3, json: true}, getUrl_3);
        // 聚合
        request.get({ url: url, json: true }, _getUrl);
      }
    };

    request(options1, getUrl1);
  };

  //------------------------------------------------------
  // team 和 sm 一起处理
  _batchsRemove = function (batchIds, callback) {
    Batch.remove({ $or: batchIds }, function (err, isOk) {
      if (err) {
        errCode = _ERRS._batchsRemove_1;
        zxutil.writeLog(ctrlName, errCode, err, {});
        return callback({ success: errCode });
      }

      if (isOk.result.ok === 1 && isOk.result.n === batchIds.length) {
        callback({ success: 1 });
      } else {
        errCode = _ERRS._batchsRemove_2;
        zxutil.writeLog(ctrlName, errCode, err, {});
        return callback({ success: errCode });
      }
    });
  };

  // _batchsCreate = function (batchs, callback) {
  //   Batch.create(batchs, function (err, bat) {
  //     if (err) {
  //       errCode = _ERRS._batchsCreate_1;
  //       zxutil.writeLog(ctrlName, errCode, {}, {});
  //       return callback({ success: errCode });
  //     }

  //     if (bat) {
  //       callback({ success: 1 });
  //     } else {
  //       errCode = _ERRS._batchsCreate_2;
  //       zxutil.writeLog(ctrlName, errCode, {}, {});
  //       return callback({ success: errCode });
  //     }
  //   });
  // };

  // _teamUpdate = function () {

  // };

  _messages = function (obj, callback) {
    var messages = obj.messages;
    var len = messages.length;
    var i;
    if (len > 0) {
      for (i = 0; i < len; i += 1) {
        messages[i]._id =
          new mongoose.Types.ObjectId; // jshint ignore:line

        messages[i].createAt = Date.now();
      }

      Message.create(messages, function (err, msg) {
        if (err) {
          return callback({ success: 10011 });
        }

        if (msg) {
          callback({ success: 1, messages: messages });
        } else {
          callback({ success: 10012 });
        }
      });
    } else {
      callback({ success: 1 });
    }
  };

  _batchs = function (obj, callback) {
    var batchs = obj.batchs;
    if (batchs.length > 0) {
      Batch.create(batchs, function (err, bat) {
        if (err) {
          errCode = _ERRS._batchs_1;
          zxutil.writeLog(ctrlName, errCode, err, {});
          return callback({ success: errCode });
        }

        if (bat) {
          _messages(obj, callback);
        } else {
          errCode = _ERRS._batchs_2;
          zxutil.writeLog(ctrlName, errCode, {}, {});
          callback({ success: errCode });
        }
      });
    } else {
      _messages(obj, callback);
    }
  };

  _ids = function (obj, callback) {
    var ids = obj.ids;
    if (ids.length > 0) {
      Batch.remove({ _id: { $in: ids } }, function (err, isOk) {
        if (err) {
          errCode = _ERRS._ids_1;
          zxutil.writeLog(ctrlName, errCode, err, {});
          return callback({ success: errCode });
        }

        if (isOk.result.ok === 1) {
          _batchs(obj, callback);
        } else {
          errCode = _ERRS._ids_2;
          zxutil.writeLog(ctrlName, errCode, {}, {});
          callback({ success: errCode });
        }
      });
    } else {
      _batchs(obj, callback);
    }
  };

  _returnTraffics = function (obj, callback) {
    var returnTraffics = obj.returnTraffics;
    if (returnTraffics) {
      Sm.update(
        { _id: returnTraffics._id },
        { $set: returnTraffics.post },
        function (err, isOk) {
          if (err) {
            return callback({ success: 10005 });
          }

          if (isOk.ok === 1) {
            _ids(obj, callback);
          } else {
            callback({ success: 10006 });
          }
        }
      );
    } else {
      _ids(obj, callback);
    }
  };

  _departureTraffics = function (obj, callback) {
    var departureTraffics = obj.departureTraffics;
    if (departureTraffics) {
      Sm.update(
        { _id: departureTraffics._id },
        { $set: departureTraffics.post },
        function (err, isOk) {
          if (err) {
            return callback({ success: 10003 });
          }

          if (isOk.ok === 1) {
            _returnTraffics(obj, callback);
          } else {
            callback({ success: 10004 });
          }
        }
      );
    } else {
      _returnTraffics(obj, callback);
    }
  };

  _trafficsAdd = function (obj, type, callback) {
    var traffics = obj[type];

    var newSm = new Sm(traffics);

    newSm.save(function (err, sm) {
      if (err) {
        return callback({ success: 10103 });
      }

      if (sm) {
        callback({ success: 1 });
      } else {
        callback({ success: 10102 });
      }
    });
  };

  addTeam = function (obj, callback) {
    var team = obj.team;

    var newTeam = new Team(team);

    newTeam.save(function (err, team) {
      if (err) {
        return callback({ success: 10101 });
      }

      if (team) {
        _trafficsAdd(obj, 'departureTraffics', function (result) {
          if (result.success === 1) {
            _trafficsAdd(obj, 'returnTraffics', function (result) {
              if (result.success === 1) {
                _batchs(obj, callback);
              } else {
                callback(result);
              }
            });
          } else {
            callback(result);
          }
        });
      } else {
        callback({ success: 10102 });
      }
    });
  };

  saveTeam = function (obj, callback) {
    var team = obj.team;

    // var departureTraffics = obj.departureTraffics;
    // var returnTraffics = obj.returnTraffics;
    // var ids = obj.ids;
    // var batchs = obj.batchs;
    // var messages = obj.messages;

    if (team) {
      Team.update({ _id: team._id }, { $set: team.post }, function (err, isOk) {
        if (err) {
          return callback({ success: 10001 });
        }

        if (isOk.ok === 1) {
          _departureTraffics(obj, callback);
        } else {
          callback({ success: 10002 });
        }
      });
    } else {
      _departureTraffics(obj, callback);
    }
  };

  _removeIds = function (obj, callback) {
    var ids = obj.ids;

    if (ids.length > 0) {
      Batch.remove({ _id: { $in: ids } }, function (err, isOk) {
        if (err) {
          errCode = _ERRS.REMOVE_ERR_3;
          zxutil.writeLog(ctrlName, errCode, err, {});
          return callback({ success: errCode });
        }

        if (isOk.result.ok === 1) {
          callback({ success: 1 });
        } else {
          errCode = _ERRS.REMOVE_FAIL_3;
          zxutil.writeLog(ctrlName, errCode, {}, {});
          callback({ success: errCode });
        }
      });
    } else {
      callback({ success: 1 });
    }
  };

  _removeTraffics = function (obj, callback) {
    Sm.remove({ _id: { $in: obj.traffics } }, function (err, isOk) {
      if (err) {
        errCode = _ERRS.REMOVE_ERR_2;
        zxutil.writeLog(ctrlName, errCode, err, {});
        return callback({ success: errCode });
      }

      if (isOk.result.ok === 1) {
        _removeIds(obj, callback);
      } else {
        errCode = _ERRS.REMOVE_FAIL_2;
        zxutil.writeLog(ctrlName, errCode, {}, {});
        callback({ success: errCode });
      }
    });
  };

  removeTeam = function (obj, callback) {
    Team.remove({ _id: obj.team }, function (err, isOk) {
      if (err) {
        errCode = _ERRS.REMOVE_ERR_1;
        zxutil.writeLog(ctrlName, errCode, err, {});
        return callback({ success: errCode });
      }

      if (isOk.result.ok === 1 && isOk.result.n === 1) {
        _removeTraffics(obj, callback);
      } else {
        errCode = _ERRS.REMOVE_FAIL_1;
        zxutil.writeLog(ctrlName, errCode, err, {});
        return callback({ success: errCode });
      }
    });
  };

  return {
    list: list,
    getObjectIds: getObjectIds,

    downloadTeam: downloadTeam,
    getTeamById: getTeamById,
    postFlightInfo: postFlightInfo,
    addTeam: addTeam,
    saveTeam: saveTeam,
    removeTeam: removeTeam,
  };
};

module.exports = createCtrl;
