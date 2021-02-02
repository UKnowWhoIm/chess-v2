var express = require('express'), http = require('http');
const socketEvents = require("./socketEvents");
var path = require("path");
var app = express();
var server = http.createServer(app);
const io = require('socket.io')(server);
const db = require("./dbCrud");
server.listen(3000);
 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/testSocket.html');
});

app.use('/static', express.static(path.join(__dirname, '/public')));
//app.use('/socket.io', express.static(path.join(__dirname, '/node_modules/socket.io/client-dist')));

io.on("connection", socket => socketEvents(io, socket));