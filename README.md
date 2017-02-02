# ygnode

docker build -t joe/ygnode:1.0.0 .

# 开发
docker run -d -p 8081:8081 -v /"$PWD"/src:/ygnode/src -v /"$PWD"/tests:/ygnode/tests -v /"$PWD"/coverage:/ygnode/coverage -v /"$PWD"/out:/ygnode/out --link ygmongo:ygmongo --link ygmongotest:ygmongotest --env JWT_TOKEN_SECRET=eF0yAEsFzjUePOqeg3ifj_8yXBY32jgvEbwV1ECJ5GOXmu1h5rMlnSHNRkodfgom --env DB_HOST=ygmongo --env DB_HOST_TEST=ygmongotest --env S_PORT=8081 --name ygnode joe/ygnode:1.0.0