const db = require("./dbCrud");
const chess = require("./chessES5");

function eventHandler(io, socket){
    socket.on("roomCreate", function(){
        db.createGameRoom().then(
            val => {
                socket.emit("getGameId", val);
                socket.join(String(val));
            }
        )
    });
    
    socket.on("roomJoin", function(roomId){
        if(io.sockets.adapter.rooms.has(String(roomId))){
            if(io.sockets.adapter.rooms.get(String(roomId)).size == 2)
                socket.emit("roomFull");
            else{
                socket.join(roomId);
                socket.emit("getGameId", roomId);
                io.to(roomId).emit("joinedRoom");
                if(io.sockets.adapter.rooms.get(String(roomId)).size == 2)
                    io.to(roomId).emit("startGame", db.initialFen);
            }
        }
        else
            socket.emit("invalidRoomId");
    });

    socket.on("makeMove", async function(gameId, from, to){
        from = Number.parseInt(from);
        to = Number.parseInt(to);
        console.log(gameId, from, to);
        let room = await db.readGameRoom(gameId);
        let boardObj = new chess.Board(room.board);
        let nexMoves = boardObj.getNextMoves();
        console.log(nexMoves[from]);
        if(nexMoves.hasOwnProperty(from) && nexMoves[from].includes(to)){
            boardObj.makeMove(from, to);
            db.updateGameRoom(gameId, boardObj.fen);
            io.to(gameId).emit("boardUpdated", boardObj.fen);
        }
        else
            socket.emit("invalidMove");
    });
}

module.exports = eventHandler;