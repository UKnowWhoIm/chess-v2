var express = require('express'), http = require('http');
const socketEvents = require("./server/socketEvents");
var path = require("path");
var app = express();
var server = http.createServer(app);
const io = require('socket.io')(server);
const dotenv = require('dotenv');
dotenv.config();

server.listen(process.env.PORT);
 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.use('/static', express.static(path.join(__dirname, '/static')));

io.on("connection", socket => socketEvents(io, socket));