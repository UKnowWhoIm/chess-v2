const utils = require("./Utils");
const PieceMap = require("./Piece").PieceMap;

class Board{
    constructor(fenRepresentation){
        this.array = [];
        this.player = null;
        this.enPassantSquare = null;
        this.castleData = null;
        this.halfMoves =  0;
        this.fullMoves = 0;
        this.fen = fenRepresentation;
        this.pawnPromotion = null;
        this.fenToBoard(fenRepresentation);
    }
    
    fenToBoard(fen){
        // FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
        let raw = fen.split(" ");
        this.array = this.getFENPieces(raw[0]);
        this.player = utils.Players[raw[1]];
        this.castleData = this.getCastleData(raw[2]);
        this.enPassantSquare = this.getEnPassantData(raw[3]);
        this.halfMoves = Number.parseInt(raw[4]);
        this.fullMoves = Number.parseInt(raw[5]);
    }

    getCastleData(castleString){
        let castleData = {};
        castleData[utils.Players.white] = {};
        castleData[utils.Players.black] = {};
        
        if(castleString.search("K") != -1)
            castleData[utils.Players.white].k = true;
        if(castleString.search("Q") != -1)
            castleData[utils.Players.white].q = true;
        if(castleString.search("k") != -1)
            castleData[utils.Players.black].k = true;
        if(castleString.search("q") != -1)
            castleData[utils.Players.black].q = true;

        return castleData;
    }

    getEnPassantData(enPassatString){
        if(enPassatString != "-")
            return utils.getLocationFromNotation(enPassatString);
    }

    getFENPieces(pieceData){
        let board = [];
        for(var i=0; i < pieceData.length; i++){
            if(PieceMap.hasOwnProperty(pieceData[i].toLowerCase()))
                board.push(new PieceMap[pieceData[i].toLowerCase()](pieceData[i]));
            else if(pieceData[i] == '/')
                continue;
            else
                for(var j=0; j < Number.parseInt(pieceData[i]); j++)
                    board.push(null);
        }
        return board;
    }

    getAllPieces(player){
        // outputs pos64
        let pieces = [];
        for(var i=0; i<64; i++) 
            if(this.array[i] && this.array[i].player == player)
                pieces.push(i);
        return pieces;
    }

    makeMove(from, to){
        // Takes pos64
        let piece = this.array[from];
        // Moves that change other pieces too
        // En Passant
        if(piece.type.toLowerCase() === "p" && (Math.abs(from - to) === 7 || Math.abs(from - to) === 9))
            if(this.array[to] == null)
                this.array[to - utils.playerMultiplier(this.player) * 8] = null;
        
        // Castling
        if(piece.type.toLowerCase() == "k"){
            if(from - to == 2){
                // Queen
                this.array[from - 1] = this.array[from - 4];
                this.array[from - 4] = null;
            }
            else if(from - to == -2){
                // King
                this.array[from + 1] = this.array[from + 3];
                this.array[from + 3] = null;
            }
        }

        // Update board state
        // En Passant & Pawn Promotion
        if(piece.type.toLowerCase() == "p"){
            if(Math.abs(from - to) == 16)
                this.enPassantSquare = Number.parseInt(to) + 
                    utils.playerMultiplier(utils.changePlayer(this.player)) * 8;
            else
                this.enPassantSquare = null;
            if(this.player == utils.Players.white && Math.floor(to / 8)  == 0 || 
                this.player == utils.Players.black && Math.floor(to / 8) == 7){

                    this.pawnPromotion = to;
            }
        }
        else
            this.enPassantSquare = null;

        // Castle
        if(piece.type.toLowerCase() == "k")
            this.castleData[this.player] = {"k": false, "q":false};
        
        if(piece.type.toLowerCase() == "r")
            if(from % 8 == 0)
                this.castleData[this.player].q = false;
            else if(from % 8 == 7)
                this.castleData[this.player].k = false;

        // HalfMove Clock
        if(piece.type.toLowerCase() == "p" || this.array[to] != null)
            this.halfMoves = 0;
        else
            this.halfMoves += 1;

        // Fullmove
        if(this.player == utils.Players.black)
            this.fullMoves += 1;
        
        // Player change
        if(this.pawnPromotion == null)
            this.player = utils.changePlayer(this.player);

        this.array[to] = this.array[from];
        this.array[from] = null;
        this.fen = this.boardToFEN();
    }

    promotePawn(piece){
        //if(this.pawnPromotion != null && Piece.getPlayer(piece) == this.player)
        this.array[this.pawnPromotion] = new PieceMap[piece.toLowerCase()](piece);
        this.pawnPromotion = null;
        this.player = utils.changePlayer(this.player);
        this.fen = this.boardToFEN();
    }

    isCheck(player=this.player){
        let piece;
        let kingPos = this.getKing(player);
        if(!kingPos)
            // King is captured(Should NEVER Happen)
            return true;
        let nextMoves = this.getNextMoves(false, utils.changePlayer(player));
        for(piece in nextMoves)
            if(nextMoves[piece].includes(kingPos))
                return true;
        return false;
    }

    checkVictory(player=this.player){
        return this.isCheck(
            utils.changePlayer(player)) && 
                Object.keys(this.getNextMoves(true, utils.changePlayer(player)))
                .length === 0;
    }

    checkStaleMate(currentPlayer){
        return !this.isCheck(currentPlayer) && Object.keys(this.getNextMoves(true, currentPlayer)).length === 0;
    }

    checkDraw(){
        if(this.checkStaleMate(utils.Players.white) || this.checkStaleMate(utils.Players.black))
            return true;
        if(this.halfMoves >= 50)
            return true;
        // TODO Insufficent Material
    }

    getNextMoves(checkForCheck=true, player=this.player){
        // Outputs as pos64 
        let pieces = this.getAllPieces(player);
        let piece, moves, board;
        let validMoves = {};
        let legalMoves = {};
        
        pieces.forEach(
            piece => validMoves[piece] = this.array[piece].getAllMoves(
                this, piece, {"checkForCheck": checkForCheck}
            )
        );
        
        if(checkForCheck)
            for(piece in validMoves){
                moves = validMoves[piece];
                moves.forEach(move => {
                    board = new Board(this.fen);
                    board.makeMove(piece, move);
                    if(!board.isCheck(player)){
                        if(legalMoves[piece])
                            legalMoves[piece].push(move);
                        else
                            legalMoves[piece] = [move];
                    }
                });
            }
        else
            return validMoves;

        return legalMoves;
    }

    getKing(player=this.player){
        let target;
        if(player == utils.Players.black)
            target = "k";
        else
            target = "K";
        for(let i=0; i<64; i++)
            if(this.array[i] && this.array[i].type == target)
                return i;

    }

    boardToFEN(){
        let blankSpaces = 0, fen = "";

        for(var i=0; i<64; i++){
            if(i % 8 == 0 && i != 0){
                if(blankSpaces)
                    fen += String(blankSpaces);
                blankSpaces = 0;
                fen += "/";
            }
            if(this.array[i]){
                if(blankSpaces)
                    fen += String(blankSpaces);
                blankSpaces = 0;
                fen += this.array[i].type;
            }
            else
                blankSpaces++;
        }
        fen += " ";

        if(this.player == utils.Players.black)
            fen += "b";
        else
            fen += "w";

        fen += " ";

        let castleString = "";
        if(this.castleData[utils.Players.white].k)
            castleString += "K";
        if(this.castleData[utils.Players.white].q)
            castleString += "Q";
        if(this.castleData[utils.Players.black].k)
            castleString += "k";
        if(this.castleData[utils.Players.black].q)
            castleString += "q";
       
        fen += castleString;
        if(!castleString)
            // Blank
            fen += "-";

        fen += ' ';
        
        if(this.enPassantSquare)
            fen += utils.getNotationFromPosition(this.enPassantSquare);
        else
            // Blank
            fen += "-";

        fen += ' ';

        fen += String(this.halfMoves);

        fen += ' ';

        fen += String(this.fullMoves);

        return fen;
    }
}

exports.Board = Board;