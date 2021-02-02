const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.DB_URL;
const db = process.env.DB_NAME;
const clGameRooms = "GameRooms";
const clWaitingRoom = "WaitingRoom";
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";

async function getDBObject(){
    var conn = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    return {"db": conn.db(db), "conn": conn};
}

async function createGameRoom(){
    room = {"white": "", "black": "", "board": initialFen};
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clGameRooms).insertOne(room);
    dbObj.conn.close();
    return obj.insertedId;
}

async function readGameRoom(id){
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clGameRooms).findOne({"_id": id});
    dbObj.conn.close();
    return obj;
}

async function updateGameRoom(id, board, white, black){
    let dbObj = await getDBObject();
    let updateData = {};

    if(board)
        updateData["board"] = board;
    if(white)
        updateData["white"] = white;
    if(black)
        updateData["black"] = black;
    
    await dbObj.db.collection(clGameRooms).updateOne({"_id": id}, {$set: updateData}, { "upsert": true });
    dbObj.conn.close();
}

async function deleteGameRoom(id){
    let dbObj = await getDBObject();
    await dbObj.db.collection(clGameRooms).deleteOne({"_id": id})
    dbObj.conn.close();
}

async function createWaitingRoom(){
    // To be executed once
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clWaitingRoom).insertOne({"clientId": ""});
    dbObj.conn.close();
    return obj.insertedId;
}

async function updateWaitingRoom(clientId){
    let dbObj = await getDBObject();
    await dbObj.db.collection(clWaitingRoom).updateOne({}, {$set: {"clientId": clientId}}, { "upsert": true });
    dbObj.conn.close();
}

async function readWaitingRoom(){
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clWaitingRoom).findOne({});
    dbObj.conn.close();
    return obj;
}

async function clearWaitingRoom(){
    updateWaitingRoom("");
}

exports.clearWaitingRoom = clearWaitingRoom;
exports.readWaitingRoom = readWaitingRoom;
exports.updateWaitingRoom = updateWaitingRoom;
exports.clearWaitingRoom = clearWaitingRoom;
exports.createGameRoom = createGameRoom;
exports.readGameRoom = readGameRoom;
exports.updateGameRoom = updateGameRoom;
exports.deleteGameRoom = deleteGameRoom;
exports.initialFen = initialFen;
