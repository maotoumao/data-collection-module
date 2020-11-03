const express = require('express');
const app = express();
const bodyParser = require('body-parser');


app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");//允许所有来源访问
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
    res.header("Access-Control-Allow-Methods","POST,OPTIONS");//允许访问的方式
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.use(bodyParser.json());
app.use('/', require('./router'));

app.listen('5678');