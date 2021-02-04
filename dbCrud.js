const MongoClient = require('mongodb').MongoClient;
const ObjectID = require("mongodb").ObjectID;
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.DB_URL;
const db = process.env.DB_NAME;
const clGameRooms = "GameRooms";
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";

async function getDBObject(){
    var conn = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    return {"db": conn.db(db), "conn": conn};
}

async function createGameRoom(){
    room = {"white": "", "black": "", "board": initialFen, "started": false, "pawnPromotionData": null};
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clGameRooms).insertOne(room);
    dbObj.conn.close();
    return String(obj.insertedId);
}

async function readGameRoom(id){
    let dbObj = await getDBObject();
    let obj = await dbObj.db.collection(clGameRooms).findOne(ObjectID(id));
    dbObj.conn.close();
    return obj;
}

async function updateGameRoom(id, board, white, black, started, promotionData){
    let dbObj = await getDBObject();
    let updateData = {};

    if(board)
        updateData["board"] = board;
    if(white)
        updateData["white"] = white;
    if(black)
        updateData["black"] = black;
    if(started)
        updateData["started"] = started;
    if(promotionData)
        updateData["pawnPromotionData"] = promotionData;
        
    await dbObj.db.collection(clGameRooms).updateOne({"_id": ObjectID(id)}, {$set: updateData}, { "upsert": true });
    dbObj.conn.close();
}

async function deleteGameRoom(id){
    let dbObj = await getDBObject();
    await dbObj.db.collection(clGameRooms).deleteOne({"_id": ObjectID(id)})
    dbObj.conn.close();
}

exports.createGameRoom = createGameRoom;
exports.readGameRoom = readGameRoom;
exports.updateGameRoom = updateGameRoom;
exports.deleteGameRoom = deleteGameRoom;
exports.initialFen = initialFen;
