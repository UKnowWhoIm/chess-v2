const db = require("./dbCrud");
const chess = require("./chessES5");

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
    
    await db.updateGameRoom(roomId, null, white, black, true);
    return {"white": white, "black": black};
}

function checkPlayer(gameData, clientId, from){
    let board = new chess.Board(gameData.board);
    if(board.array[from])
        if(board.array[from].player == chess.Players.white && gameData.white == clientId)
            return true;
        if(board.array[from].player == chess.Players.black && gameData.black == clientId)
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
                            io.to(playerData.white).emit("playerColor", chess.Players.white);
                            io.to(playerData.black).emit("playerColor", chess.Players.black);
                            io.to(roomId).emit("startGame", db.initialFen);
                        }
                    );
                }
            }
        }
        else
            socket.emit("invalidRoomId");
    });

    socket.on("reJoin", async function(roomId){
        if(io.sockets.adapter.rooms.has(String(roomId))){
            let room = await db.readGameRoom(roomId);
            if(room.white == socket.id || room.black == socket.id)
                socket.emit("reJoinSuccess", room.board);
        }
    });

    socket.on("makeMove", async function(gameId, from, to){
        from = Number.parseInt(from);
        to = Number.parseInt(to);
        let room = await db.readGameRoom(gameId);
        console.log(room.pawnPromotionData);
        if(room.pawnPromotionData != null){
            socket.emit("errorPawnPromotion");
            return;
        }

        if(checkPlayer(room, socket.id, from)){
            let boardObj = new chess.Board(room.board);
            let nexMoves = boardObj.getNextMoves();
            if(nexMoves.hasOwnProperty(from) && nexMoves[from].includes(to)){
                boardObj.makeMove(from, to);
                if(boardObj.pawnPromotion != null)
                    db.updateGameRoom(gameId, boardObj.fen, null, null, null, {"player": boardObj.player, "cell": boardObj.pawnPromotion});
                else
                    db.updateGameRoom(gameId, boardObj.fen);
                
                let winner, gameOver=false;
                
                if(boardObj.checkVictory(chess.Players.white))
                    winner = chess.Players.white;
                else if(boardObj.checkVictory(chess.Players.black))
                    winner = chess.Players.black;

                io.to(gameId).emit("boardUpdated", boardObj.fen);
                
                if(winner != null && boardObj.checkDraw()){
                    io.to(gameId).emit("draw");
                    gameOver = true;
                }
                else if(winner != null){
                    io.to(gameId).emit("victory", winner);
                    gameOver = true;
                }
                console.log(gameOver, boardObj.pawnPromotion);
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

    socket.on("promotePawn", async function(id, piece){
        let room = await db.readGameRoom(id);
        let board = new Board(room.board);
        if(Object.keys(room.promotionData).length !== 0){
            if(room.white == socket.id && room.promotionData.player == Players.white || room.black == socket.id && room.promotionData.player == Players.black)
                if(room.promotionData.player == Piece.getPlayer(piece)){
                    board.pawnPromotion = room.promotionData.cell;
                    board.promotePawn(piece);
                    db.updateGameRoom(id, board.fen, null, null, null, "");
                    io.to(gameId).emit("boardUpdated", boardObj.fen);
                    socket.emit("succeessPawnPromotion");
                    return;
                }
        }
        socket.emit("errorPawnPromotion");
    });

    socket.on('disconnecting', function(){
        var self = this;
        var rooms = Object.keys(self.rooms);

        rooms.forEach(async function(room){
            self.to(room).emit('playerDisconnect');
            if((await db.readGameRoom(room)).started){
                self.to(room).emit("endGameDisconnect");
                db.deleteGameRoom(room);
            }
            else if(io.adapter.sockets.rooms.get(room).size == 0)
                db.deleteGameRoom(room);
        });
    });
}

module.exports = eventHandler;