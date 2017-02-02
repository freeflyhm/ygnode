# ygnode

[![Build Status](https://travis-ci.org/freeflyhm/ygnode.svg?branch=master)](https://travis-ci.org/freeflyhm/ygnode)
[![Coverage Status](https://coveralls.io/repos/github/freeflyhm/ygnode/badge.svg?branch=master)](https://coveralls.io/github/freeflyhm/ygnode?branch=master)
[![Code Climate](https://codeclimate.com/github/freeflyhm/ygnode/badges/gpa.svg)](https://codeclimate.com/github/freeflyhm/ygnode)
[ ![Codeship Status for freeflyhm/ygnode](https://codeship.com/projects/75711720-cb7f-0134-e402-56c43863b4c3/status?branch=master)](https://codeship.com/projects/199909)

newzxnode 是 full REST API 服务

--------------------------
docker build -t joe/ygnode:1.0.0 .

# 开发
docker run -d -p 8081:8081 -v /"$PWD"/src:/ygnode/src -v /"$PWD"/tests:/ygnode/tests -v /"$PWD"/coverage:/ygnode/coverage -v /"$PWD"/out:/ygnode/out --link ygmongo:ygmongo --link ygmongotest:ygmongotest --env JWT_TOKEN_SECRET=eF0yAEsFzjUePOqeg3ifj_8yXBY32jgvEbwV1ECJ5GOXmu1h5rMlnSHNRkodfgom --env DB_HOST=ygmongo --env DB_HOST_TEST=ygmongotest --env S_PORT=8081 --name ygnode joe/ygnode:1.0.0

--------------------------
# 修改时区
docker exec -it ygnode /bin/bash
date -R
tzselect
5 → 回车 → 9 → 回车 → 1 → 回车 → 1
cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

--------------------------
# jsdoc
jsdoc -c jsdoc.conf.json

--------------------------
# 图片

https://travis-ci.org/

https://coveralls.io/

https://codeclimate.com/

https://gemnasium.com/

https://david-dm.org/

https://codeship.com/

https://ci.appveyor.com/

https://saucelabs.com/

https://gitter.im/

https://github.com/mochajs/mocha#backers

https://github.com/mochajs/mocha#sponsors
