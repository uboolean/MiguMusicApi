/// <reference path="./util/type.ts" />
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import fs from 'fs';
import RouterMap = Types.RouteMap;

const app = express();


app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    // 为了安全，可指定域名白名单，此处为所有域名都可访问，配置多个域名白名单不可直接写数组，要判断条件后赋值单个域名
    // res.header("Access-Control-Allow-Origin", "http://localhost:8080",'http://www.baidu.com'); 
    // 也可以这样写上多个白名单的地址
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,token");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

fs.readdirSync(path.join(__dirname, 'routes')).reverse().forEach(file => {
  const filename = file.replace(/(\.js|\.ts)$/, '');
  const RouterMap: RouterMap = require(`./routes/${filename}`).default;
  Object.keys(RouterMap).forEach((path: string): void => {
    let fullPah = `/${filename}${path}`;
    if (fullPah === '/index/') {
      fullPah = '/';
    }
    app.use(fullPah, (req, res, next) => {
      const router = express.Router();
      req.query = {
        ...req.query,
        ...req.body,
      };
      let routeFunc = RouterMap[path];
      const func = async (req, res) => {
        const result = await routeFunc({
          query: req.query,
          res,
        }).catch((err) => ({ result: 200, errMsg: `异常：${err.message}`}))
        if (typeof result === 'object') {
          res.send(result);
        }
      };
      router.post('/', func);
      router.get('/', func);
      router(req, res, next);
    });
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
