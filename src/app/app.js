/* jshint
   node:  true,  devel:  true,
   maxstatements: 19, maxparams: 4, maxdepth: 2,
   maxerr: 50,       nomen: true,  regexp: true
 */

/**
 * Express app 模块
 * @module app/app
 */
'use strict';

var ZXWX_APPID = 'wxfa17b64007072d37';
var ZXWX_SECRET = '65b8d60c1b8436f1f2ae6cd3f3807c7a';
var checkedAppid = function (str) {
  if (str.indexOf(ZXWX_APPID) === -1) {
    return false;
  }

  return true;
};

var getClientIp = function (req) {
  var ip;
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(',')[0];
    if (ip) {
      return ip;
    }
  }

  return req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
}

var createApp = function (dbHost) {
  /* 引入模块依赖 */
  var express    = require('express');

  var bodyParser = require('body-parser');
  var jwt        = require('jsonwebtoken');

  // var request    = require('request');

  var getCtrl    = require('./ctrl');
  var zxwxinfo   = require('./zxwxinfo');
  var User       = getCtrl(dbHost, 'auth', 'user');
  var Team       = getCtrl(dbHost, 'hz', 'team');     // 借用一下杭州数据库 只用于微信小程序查询航班
  var Idcardsm   = getCtrl(dbHost, 'hz', 'idcardsm'); // 借用一下杭州数据库 只用于微信小程序驗證身份證

  /* 实例化 Express.js 对象 */
  var app = express();

  /* 相关配置 */
  /* 连接数据库 */
  /* 定义中间件 */
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));

  /* 定义路由 */
  app.get('/', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('server look\'s good');
  });

  /**
   * yg -- api: 注册
   *
   * req.body: {
   *   province
   *   city
   *   cname
   *   ctel
   *   cfax
   *   caddress
   *   uusername
   *   upassword
   *   uname
   *   uphone
   *   uqq
   *   ucompanyabbr
   * }
   * @returns {}
   */
  app.post('/api/register', function (req, res) {
    // 限制客户端输入数据
    var obj = {
      companyObj: {
        province: req.body.province,
        city: req.body.city,
        name: req.body.cname,
        tel: req.body.ctel,
        fax: req.body.cfax,
        address: req.body.caddress,
      },
      userObj: {
        userName: req.body.uusername,
        password: req.body.upassword,
        name: req.body.uname,
        phone: Number(req.body.uphone),
        qq: Number(req.body.uqq),
        companyAbbr: req.body.ucompanyabbr,
      },
    };

    User.register(obj, function (results) {
      res.setHeader('Access-Control-Allow-Origin', '*');

      // 过滤 为测试返回的results.user, 不发送到客户端, 减少流量
      res.json({ success: results.success });
    });
  });

  /**
   * api: 登录
   * req.body: { userName, password }
   * @returns {}
   */
  app.post('/api/login', function (req, res) {
    // 限制客户端输入数据
    var obj = {
      userName:  req.body.userName,
      password: req.body.password,
    };

    res.setHeader('Access-Control-Allow-Origin', '*');

    User.login(obj, function (results) {
      if (results.success === 1) {
        // we are sending the profile in the token
        // 有效时间 7days 60 * 60 * 24 * 7 = 604800
        var token = jwt.sign(
          results.profile,
          process.env.JWT_TOKEN_SECRET,
          { expiresIn: 604800 }
        );

        return res.json({
          success: 1,
          token: token,
          dbName: results.dbName,
        });
      }

      res.json(results);
    });
  });

  app.get('/api/provincecity', function (req, res) {
    var results = require('./zxutil').PROVINCE_CITY;
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.json(results);
  });

  // app.get('/api/code/:id', function (req, res) {
  //   var id = req.params.id || '1';
  //   var j = request.jar();
  //   var url;

  //   if (id === '1') {
  //     url = 'http://pingan.com/sics/sicsweb/image.jsp';
  //   } else {
  //     url = 'http://www.e-chinalife.com/' +
  //         'selfcard/selfcard/validateNum/image.jsp';
  //   }

  //   res.setHeader('Access-Control-Allow-Origin', '*');
  //   request.get(url, { jar: j })
  //   .on('error', function (err) {
  //     console.log(err);
  //   }).pipe(res);
  // });

  // djp -- 登机牌客户端
  app.post('/djp/list', function (req, res) {
    var obj = req.body;
    var Djp = getCtrl(dbHost, obj.city, 'djp');

    Djp.list(obj, function (result) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result);
    });
  });

  app.post('/djp/isdownload', function (req, res) {
    var obj  = req.body;
    var Djp  = getCtrl(dbHost, obj.city, 'djp');

    Djp.isdownload(obj, function (result) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result);
    });
  });

  app.post('/djp/isprint', function (req, res) {
    var obj  = req.body;
    var Djp  = getCtrl(dbHost, obj.city, 'djp');

    Djp.isprint(obj, function (result) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result);
    });
  });

  app.post('/djp/djpnote', function (req, res) {
    var obj  = req.body;
    var Djp  = getCtrl(dbHost, obj.city, 'djp');

    Djp.djpnote(obj, function (result) {
      // 指定允许跨域访问
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result);
    });
  });

  // 微信小程序
  app.get('/zxwx/sendinfo', function(req, res) {
    if (checkedAppid(req.headers.referer)) {
      res.json(zxwxinfo.sendinfo);
    }
  });
  app.get('/zxwx/aboutinfo', function(req, res) {
    if (checkedAppid(req.headers.referer)) {
      res.json(zxwxinfo.aboutinfo);
    }
  });
  //// 航班
  app.post('/zxwx/flight', function (req, res) {
    // 只接收来自自己小程序的 post
    if (checkedAppid(req.headers.referer)) {
      Team.postFlightInfo({
        flightNum: req.body.flight,
        flightDate: req.body.date
      }, function (result) {
        res.json(result);
      });
    }
  });

  //// 身份证验证
  app.post('/zxwx/login', function (req, res) {
    if (checkedAppid(req.headers.referer)) {
      Idcardsm.zxwxPostLogin({
        APPID: ZXWX_APPID,
        SECRET: ZXWX_SECRET,
        JSCODE: req.body.code,
        body: '智享阳光服务-身份验证',
        attach: '身份验证費',
        total_fee: 100, // 订单总金额，单位为分
        spbill_create_ip: getClientIp(req),
        notify_url: 'https://node.zxsl.net.cn/zxwx/notify'
      }, function (result) {
        res.json(result);
      });
    }
  });
  app.get('/zxwx/notify', function (req, res) {
    res.end();
  });
  app.post('/zxwx/idcard', function (req, res) {
    if (checkedAppid(req.headers.referer)) {
      Idcardsm.zxwxPostIdcard({
        cardNum: req.body.idcard,
        name: req.body.name
      }, function (result) {
        res.json(result);
      });
    }
  });

  //// 保险查询
  app.post('/zxwx/insurance', function (req, res) {
    if (checkedAppid(req.headers.referer)) {
      // db name
      var Pingan = getCtrl(dbHost, req.body.db, 'pingan');
      Pingan.zxwxFindByName({
        name: req.body.name
      }, function (result) {
        res.json(result);
      });
    }
  });
  app.post('/zxwx/insuranceinfo', function (req, res) {
    // console.log(req.body);
    // { pinganCardNum: '0113656000079931',
    //   password: '565665',
    //   cardNum: '440301197402264428' }
    if (checkedAppid(req.headers.referer)) {
      var Pingan = getCtrl(dbHost, 'hz', 'pingan');
      Pingan.zxwxInsuranceinfo({
        pinganCardNum: req.body.pinganCardNum,
        password: req.body.password,
        cardNum: req.body.cardNum,
        cardpwd: req.body.cardpwd
      }, function (result) {
        res.json(result);
      });
    }
  });

  return app;
};

module.exports = createApp;
