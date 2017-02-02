# ygnode

[![Build Status](https://travis-ci.org/freeflyhm/ygnode.svg?branch=master)](https://travis-ci.org/freeflyhm/ygnode)

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
