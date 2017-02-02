/* jshint
   node: true,        devel: true,
   maxstatements: 28, maxparams: 3, maxdepth: 2,
   maxerr: 50,        nomen: true,  regexp: true
 */

/**
 * idcardsm controller 模块
 * @module app/controllers/idcardsm
 */
'use strict';

var request = require('request');
var crypto = require('crypto');
// key设置路径：微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
var ZXWX_KEY = '1cd2a1fedf8cda6bfa0869c3ef735773';

// 随机字符串产生函数
var createNonceStr = function () {
  return Math.random().toString(36).substr(2, 15);
}

// 时间戳产生函数
var createTimeStamp = function () {
  return parseInt(new Date().getTime() / 1000) + '';
}

// object-->string
var thisraw = function (args) {
  var keys = Object.keys(args);
  keys = keys.sort();
  var newArgs = {};
  keys.forEach(function(key) { 
    newArgs[key] = args[key];
  }) 
  var string = '';
  for (var k in newArgs) { 
    string += '&' + k + '=' + newArgs[k];
  } 
  string = string.substr(1);
  return string;
}

// 统一下单接口加密获取sign
var paysignjsapi = function (appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
  var ret = { 
   appid: appid, 
   attach: attach, 
   body: body, 
   mch_id: mch_id, 
   nonce_str: nonce_str, 
   notify_url: notify_url, 
   openid: openid, 
   out_trade_no: out_trade_no, 
   spbill_create_ip: spbill_create_ip, 
   total_fee: total_fee, 
   trade_type: trade_type 
  };
  var string = thisraw(ret);
  string = string + '&key=' + ZXWX_KEY;
  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex'); 
  return sign.toUpperCase();
}

var getXMLNodeValue = function (node_name, xml) {
  if (xml.indexOf(node_name) !== -1) {
    var tmp = xml.split("<" + node_name + ">");
    var tmp1 = tmp[1].split("</" + node_name + ">");
    var tmp2 = tmp1[0].split('[');
    var tmp3 = tmp2[2].split(']');
    return tmp3[0];
  } else {
    return null;
  }
  
};

// 支付md5加密获取sign
var paysignjs = function (appid, nonceStr, _package, signType, timeStamp) {
  var ret = { 
    appId: appid, 
    nonceStr: nonceStr, 
    package: _package, 
    signType: signType, 
    timeStamp: timeStamp 
  };
  var string = thisraw(ret);
  string = string + '&key=' + ZXWX_KEY;
  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
  return sign.toUpperCase();
};

var createCtrl = function (dbHost, dbName) {
  // 16
  var _ERRS = {
    ADD_ERR: '16999',
  };
  var ctrlName = 'idcardsm';
  var Idcardsm = require('../model')(dbHost, dbName, ctrlName);
  var Idcard = require('../model')(dbHost, 'auth', 'idcard');
  var zxutil = require('../zxutil');
  var errCode;

  // var fs = require('fs');
  // var errorLogfile =
  //     fs.createWriteStream(__dirname + 'db_err.log', { flags: 'a' });

  // public methods
  var findIdcard;
  var add;
  var addToIdCard; // 仅仅入库姓名与身份证一致的条目
  var aggregateMessage;
  var aggregateName;
  var addToIdCardFromIdCardSm;
  var zxwxPostLogin;
  var zxwxPostIdcard;

  findIdcard = function (obj, callback) {
    Idcard.findOne(obj, function (err, idcard) {
      if (err) {
        errCode = _ERRS.ADD_ERR;
        zxutil.writeLog(ctrlName, errCode, err, obj);
        callback({ idcard: null });
      }

      callback({ idcard: idcard });
    });
  };

  add = function (obj) {
    var newObj = new Idcardsm(obj);

    newObj.save(function (err) {
      if (err) {
        errCode = _ERRS.ADD_ERR;
        zxutil.writeLog(ctrlName, errCode, err, obj);
      }
    });
  };

  addToIdCard = function (obj) {
    // obj: { cardNum, name }
    var newObj = new Idcard(obj);

    newObj.save(function (err) {
      if (err) {
        errCode = _ERRS.ADD_ERR;
        zxutil.writeLog(ctrlName, errCode, err, obj);
      }
    });
  };

  // 按 message 汇总
  aggregateMessage = function (callback) {
    Idcardsm.aggregate([
      { $project: { message: 1, _id: 0 } },
      { $group: { _id: '$message', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec(function (err, messages) {
      if (err) { callback([]); }

      callback(messages);
    });
  };

  // 统计重名
  // 姓名与身份证一致
  aggregateName = function (callback) {
    Idcardsm.aggregate([
      { $project: { name: 1, cardNum: 1, _id: 0 } },
      {
        $group: {
          _id: { name: '$name', cardNum: '$cardNum' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 2000 },
    ]).exec(function (err, names) {
      if (err) { callback([]); }

      callback(names);
    });
  };

  // 批处理 addToIdCardFromIdCardSm
  addToIdCardFromIdCardSm = function (callback) {
    Idcardsm.aggregate([
      { $match: { message: '一致' } },
      { $project: { name: 1, cardNum: 1, _id: 0 } },
      {
        $group: {
          _id: { name: '$name', cardNum: '$cardNum' },
          count: { $sum: 1 },
        },
      },
    ]).exec(function (err, pps) {
      var i = 0;
      var len;

      if (err) { callback(i); }

      len = pps.length;

      pps.forEach(function (pp) {
        Idcard.findOneAndUpdate(
          { cardNum: pp._id.cardNum },
          { $set: { name: pp._id.name } },
          { new: false, upsert: true }, function () {
            i += 1;
            if (i === len) {
              callback(len);
            }
          });
      });
    });
  };

  zxwxPostLogin = function (obj, callback) {
    // https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
    var url1 = 'https://api.weixin.qq.com/sns/jscode2session?appid=' +
        obj.APPID +
        '&secret=' +
        obj.SECRET +
        '&js_code=' +
        obj.JSCODE +
        '&grant_type=authorization_code';

    var bodyObj;

    // login
    request.get({ url: url1},
        function (error, response, body) {

      if (error || response.statusCode !== 200) {
        callback({});
        return;
      }

      // body
      // {"session_key":"cOllXlOYlhPilZKJlDv+FA==","expires_in":2592000,"openid":"o0WP60JsDFq8jHjHMheyDtUhZUJA"}

      try {
        bodyObj = JSON.parse(body);
        if (!bodyObj.openid) {
          callback({});
          return;
        }
      } catch(e) {
        callback({});
        return;
      }

      
      // 统一下单
      // appid obj.APPID 小程序ID
      // mch_id 1358196902 微信支付商户号
      // nonce_str createNonceStr() 随机字符串，不长于32位
      // sign paysignjsapi() 签名
      // appid, attach, body, mch_id, nonce_str, notify_url, openid, 
      // out_trade_no, spbill_create_ip, total_fee, trade_type
      // body 智享阳光服务-身份验证 商品简单描述 该字段须严格按照规范传递
      // attach '测试' 附加数据
      // out_trade_no  'idcard' + createNonceStr() + createTimeStamp() 商户系统内部的订单号
      // total_fee obj.total_fee 100 订单总金额，单位为分
      // spbill_create_ip obj.spbill_create_ip 用户IP
      // notify_url https://node.zxsl.net.cn/zxwx/notify
      // trade_type JSAPI
      // openid body.openid
      var mch_id = '1358196902';
      var nonce_str = createNonceStr();
      var timeStamp = createTimeStamp();
      var out_trade_no = 'idcard' + nonce_str + timeStamp;

      var formData = '<xml>';
      formData += '<appid>' + obj.APPID + '</appid>'; // appid
      formData += '<mch_id>' + mch_id + '</mch_id>'; //商户号 
      formData += '<nonce_str>' + nonce_str + '</nonce_str>'; //随机字符串，不长于32位。 
      formData += '<sign>' +
        paysignjsapi(
          obj.APPID,
          obj.attach,
          obj.body,
          mch_id,
          nonce_str,
          obj.notify_url,
          bodyObj.openid,
          out_trade_no,
          obj.spbill_create_ip,
          obj.total_fee,
          'JSAPI'
        ) + '</sign>';
      formData += '<body>' + obj.body + '</body>';
      formData += '<attach>' + obj.attach + '</attach>'; //附加数据 
      formData += '<out_trade_no>' + out_trade_no + '</out_trade_no>';
      formData += '<total_fee>' + obj.total_fee + '</total_fee>';
      formData += '<spbill_create_ip>' + obj.spbill_create_ip + '</spbill_create_ip>';
      formData += '<notify_url>' + obj.notify_url + '</notify_url>';
      formData += '<trade_type>JSAPI</trade_type>';
      formData += '<openid>' + bodyObj.openid + '</openid>';
      formData += '</xml>';

      request({
        url: 'https://api.mch.weixin.qq.com/pay/unifiedorder', 
        method: 'POST', 
        body: formData
      }, function (error, response, body) {
        if (error || response.statusCode !== 200) {
          callback({});
          return;
        }

        // 再次签名
        var prepay_id = getXMLNodeValue('prepay_id', body.toString("utf-8"));
        if (!prepay_id) {
          callback({});
          return;
        }

        var _paySignjs = paysignjs(obj.APPID, nonce_str, 'prepay_id=' + prepay_id, 'MD5', timeStamp);
        var args = {
         timeStamp: timeStamp, 
         nonceStr: nonce_str,
         package: prepay_id, 
         paySign: _paySignjs 
        };
        callback(args);
      });
    });
  };

  zxwxPostIdcard = function (obj, callback) {
    // 在自己的数据库中找
    findIdcard({ cardNum: obj.cardNum }, function (result) {
      if (result.idcard) {
        if (result.idcard.name === obj.name) {
          obj.message = '一致';
        } else {
          obj.message = '不一致';
        }

        callback({
          error_code: 0,
          result: {
            message: obj.message,
          },
        });
      } else {
        // callback({
        //   error_code: 0,
        //   result: {
        //     message: '找何苗',
        //   },
        // });

        // zhixiangshanglv yangguang2016!
        var key = '705c841dfae84982bfe13a708abfa59b';
        var realname = obj.name;
        var idcard = obj.cardNum;
        var url = 'http://api.avatardata.cn/IdCardCertificate/Verify?key=' +
            key +
            '&realname=' +
            encodeURI(realname) +
            '&idcard=' +
            idcard;

        request.get({ url: url, json: true },
            function (error, response, body) {

          if (error || response.statusCode !== 200) {
            callback({
              error_code: 999,
              reason: '请求失败',
            });
            return;
          }

          //body
          //{ error_code: 10010, reason: '请求超过次数限制，请购买套餐' }

          if (body.error_code === 0) {
            // 查询成功
            if (obj.message === '一致') {
              addToIdCard({
                cardNum: obj.cardNum,
                name: obj.name,
              });
            }
          }

          callback(body);
        });
      }
    });
  };

  return {
    findIdcard: findIdcard,
    add: add,
    addToIdCard: addToIdCard,
    aggregateMessage: aggregateMessage,
    aggregateName: aggregateName,
    addToIdCardFromIdCardSm: addToIdCardFromIdCardSm,
    zxwxPostLogin: zxwxPostLogin,
    zxwxPostIdcard: zxwxPostIdcard
  };
};

module.exports = createCtrl;
