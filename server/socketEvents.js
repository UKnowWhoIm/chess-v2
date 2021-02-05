const db = require("./dbCrud");
const Players = require("./chess/Utils").Players;
const chessPiece = require("./chess/Piece").Piece;
const chessBoard = require("./chess/Board").Board;

async function assignRoom(roomId, clients){
    // Assign clients colors randomly and start game
    let rand = Math.floor(Math.random() * 100)
    clients = Array.from(clients);
    
    let white, black;
    if(rand % 2 == 1){
        white = clients[1];
        black = clients[0];
    }
    else{
        white = clients[0];
        black = clients[1];
    }
    
    await db.updateGameRoom(roomId, undefined, white, black, true);
    return {"white": white, "black": black};
}

function checkPlayer(gameData, clientId, from){
    let board = new chessBoard(gameData.board);
    if(board.array[from])
        if(board.array[from].player == Players.white && gameData.white == clientId)
            return true;
        if(board.array[from].player == Players.black && gameData.black == clientId)
            return true;

    return false;
}

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
                if(io.sockets.adapter.rooms.get(String(roomId)).size == 2){
                    assignRoom(roomId, io.sockets.adapter.rooms.get(String(roomId))).then(
                        playerData => {
                            io.to(playerData.white).emit("playerColor", Players.white);
                            io.to(playerData.black).emit("playerColor", Players.black);
                            io.to(roomId).emit("startGame", db.initialFen);
                        }
                    );
                }
            }
        }
        else
            socket.emit("invalidRoomId");
    });

    socket.on("makeMove", async function(gameId, from, to){
        from = Number.parseInt(from);
        to = Number.parseInt(to);
        let room = await db.readGameRoom(gameId);
        if(room.pawnPromotionData !== null){
            socket.emit("errorPawnPromotion");
            return;
        }

        if(checkPlayer(room, socket.id, from)){
            let boardObj = new chessBoard(room.board);
            let nexMoves = boardObj.getNextMoves();
            if(nexMoves.hasOwnProperty(from) && nexMoves[from].includes(to)){
                boardObj.makeMove(from, to);
                if(boardObj.pawnPromotion != null)
                    db.updateGameRoom(gameId, boardObj.fen, undefined, undefined, undefined, {"player": boardObj.player, "cell": boardObj.pawnPromotion});
                else
                    db.updateGameRoom(gameId, boardObj.fen);
                
                let winner, gameOver=false;
                
                if(boardObj.checkVictory(Players.white))
                    winner = Players.white;
                else if(boardObj.checkVictory(Players.black))
                    winner = Players.black;

                io.to(gameId).emit("boardUpdated", boardObj.fen);
                
                if(winner != null && boardObj.checkDraw()){
                    io.to(gameId).emit("draw");
                    gameOver = true;
                }
                else if(winner != null){
                    io.to(gameId).emit("victory", winner);
                    gameOver = true;
                }
                if(!gameOver && boardObj.pawnPromotion != null)
                    io.to(gameId).emit("startPawnPromotion", boardObj.player);
                
                // As game is Over
                if(gameOver) 
                    db.deleteGameRoom(gameId);
                return;
            }
        }
        socket.emit("invalidMove");
    });

    socket.on("promotePawn", async function(gameId, piece){
        let room = await db.readGameRoom(gameId);
        let boardObj = new chessBoard(room.board);
        if(Object.keys(room.pawnPromotionData).length !== 0){
            if(room.white == socket.id && room.pawnPromotionData.player == Players.white || room.black == socket.id && room.pawnPromotionData.player == Players.black)
                if(room.pawnPromotionData.player == chessPiece.getPlayer(piece)){
                    boardObj.pawnPromotion = room.pawnPromotionData.cell;
                    boardObj.promotePawn(piece);
                    db.updateGameRoom(gameId, boardObj.fen, undefined, undefined, undefined, null);
                    io.to(gameId).emit("boardUpdated", boardObj.fen);
                    socket.emit("successPawnPromotion");
                    return;
                }
        }
        socket.emit("errorPawnPromotion");
    });

    socket.on('disconnecting', function(){
        var self = this;
        var rooms = self.rooms;
        rooms.forEach(async function(room){
            self.to(room).emit('playerDisconnect');
            let roomDB;
            try{
                roomDB = await db.readGameRoom(room);
            }
            catch{
                roomDB = null;
            }
            if(roomDB && roomDB.started){
                self.to(room).emit("endGameDisconnect");
                db.deleteGameRoom(room);
            }
            // sockets.io will automatically delete room if empty
            else if(roomDB && io.sockets.adapter.rooms.get(String(room)) === undefined)
                db.deleteGameRoom(room);
        });
    });
}

module.exports = eventHandler;