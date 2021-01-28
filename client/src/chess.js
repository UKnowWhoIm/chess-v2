// Common Utility Functions

const Players = {
    "white": 0,
    "black": 1,
    "w": 0,
    "b": 1
}

function hasLowerCase(str){return String(str).toUpperCase() != str;}

function getCoordinates(position){return [Math.floor(position / 8), (position % 8)];}

function getPosition(coordinates){return coordinates[0] * 8 + coordinates[1];}

function addCoordinates(cood1, cood2){return [cood1[0]*1 + cood2[0], cood1[1]*1 + cood2[1]];}

function isLeftEdge(position){return position % 8 == 0;}

function isRightEdge(position){return position % 8 == 7;}

function getLocationFromNotation(notation){
    // e6 -> [2, 4]
    const col = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7};
    return [ 8 - String.parseInt(notation[1]) , col[notation[0]]];
}

function changePlayer(player){
    if(player == Players.black) 
        return Players.white;
    return Players.black;
}

function playerMultiplier(player){
    if(player == Players.black)
        return 1;
    return -1;
}

function checkOutOfBounds(currentCoordinate, nextCoordinate){
    let resultCoordinate = addCoordinates(currentCoordinate, nextCoordinate);

    if(resultCoordinate[0] > 7 || resultCoordinate[1] > 7)
        return true;
    if(resultCoordinate[0] < 0 || resultCoordinate[1] < 0)
        return true;
    return false;
}

// Piece Classes

class Piece{
    constructor(type, nextNormalMoves, nextCaptureMoves, multipleMoves){
        this.type = type;
        this.player = Piece.getPlayer(type);
        this.nextNormalMoves = nextNormalMoves;
        this.nextCaptureMoves = nextCaptureMoves;
        this.multipleMoves = multipleMoves;
    }

    getSpecialMoves(board, position){
        // Outputs absolute position
        return [];
    }

    getAllMoves(board, position){
        /**
         * Converts to coordinates(2d) and processes as checkOutOfBounds logic is in 2d
         * Otherwise will lead to confusing choices when -ve numbers come to play
         * eg: for N -> actual move [2, -1] => 15 => [1, 7] (in checkOutOfBounds)
         * Similary for [1, -1] => 7 => [0, 7]
         * 
         * Final moves are always +ve so it is unaffected
         */
        position = Number.parseInt(position);
        let positionCoord = getCoordinates(position);
        let moves = [], move;
        for(move of this.nextNormalMoves){
            if(!checkOutOfBounds(positionCoord, move)){
                if(this.nextCaptureMoves && board.array[getPosition(addCoordinates(move, positionCoord))])
                    continue;
                if(this.multipleMoves){
                    for(var pos = positionCoord; !checkOutOfBounds(pos, move); pos = addCoordinates(move, pos))
                        if((board.array[getPosition(addCoordinates(move, pos))]?.player) != board.player)
                            moves.push(getPosition(addCoordinates(move, pos)));
                }
                else
                    if(board.array[move + pos]?.player != board.player)
                        moves.push(getPosition(addCoordinates(move, positionCoord)));
            }
        }
        // Capture Moves(Pawn)
        for(move of this.nextCaptureMoves)
            if(!checkOutOfBounds(position, move) && board.array[getPosition(addCoordinates(move, positionCoord))]?.player == changePlayer(board.player))
                moves.push(getPosition(addCoordinates(move, positionCoord)));

        moves.push(...this.getSpecialMoves(board, position));
        return moves;
    }

    static getPlayer(piece){
        if (piece == null)
            return null;
        if(hasLowerCase(piece))
            return Players.black;
        return Players.white
    }

}

class Pawn extends Piece{
    constructor(type){
        super(type, [], [], false);
        this.setNextMoves();
    }

    setNextMoves(){
        this.nextNormalMoves = [[playerMultiplier(this.player), 0]];

        this.nextCaptureMoves = [
            [playerMultiplier(this.player), 1],
            [playerMultiplier(this.player), -1],
        ];
    }

    getSpecialMoves(board, position){
        let startingCol = {}, moves = [];
        startingCol[Players.white] = 6;
        startingCol[Players.black] = 1;
        if(startingCol[this.player] == Math.floor(position / 8))
            moves.push(position + playerMultiplier(this.player) * 16);

        if(board.enPassantSquare){
            let nextRow = playerMultiplier(this.player) * 8;
            
            if(board.enPassantSquare == nextRow + 1 && !isRightEdge(position) || 
            board.enPassantSquare == nextRow - 1 && !isLeftEdge(position))
                
                moves.push(board.enPassantSquare);
        }

        return moves;
    }
}

class Knight extends Piece{
    constructor(type){
        super(type, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [2, -1], [2, 1]], [], false);
    }
}

class Bishop extends Piece{
    constructor(type){
        super(type, [[1, -1], [-1, 1], [-1, -1], [1, 1]], [], true);
    }
}

class Rook extends Piece{
    constructor(type){
        super(type, [[1, 0], [-1, 0], [0, -1], [0, 1]], [], true);
    }
}

class Queen extends Piece{
    constructor(type){
        super(type, [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, 1], [-1, -1], [1, 1]], [], true);
    }
}

class King extends Piece{
    constructor(type){
        super(type, [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, 1], [-1, -1], [1, 1]], [], false);
    }

    getSpecialMoves(board, position){
        let moves = [];
        if(board.castleData[board.player]['k'])
            if(board.array[position + 1] == null && board.array[position + 2] == null 
                && !board.isCheck())
                    moves.push(position + 2);
        
        if(board.castleData[board.player]['q'])
            if(board.array[position - 1] == null && board.array[position - 2] == null  && board.array[position - 3]
                && !board.isCheck())
                    moves.push(position - 2);
        
        return moves;
    }
}

const PieceMap = {
    "p": Pawn,
    "n": Knight,
    "b": Bishop,
    "r": Rook,
    "q": Queen,
    "k": King,
};

// Board Class

export class Board{
    constructor(fenRepresentation){
        this.array = [];
        this.player = null;
        this.enPassantSquare = null;
        this.castleData = null;
        this.halfMoves =  0;
        this.fullMoves = 0;
        this._fen = fenRepresentation;
        this.fenToBoard(fenRepresentation);
    }
    
    fenToBoard(fen){
        // FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
        let raw = fen.split(" ");
        this.array = this.getFENPieces(raw[0]);
        this._blackPieces = [];
        this._whitePieces = [];
        this.player = Players[raw[1]];
        this.castleData = this.getCastleData(raw[2]);
        this.enPassantSquare = this.getEnPassantData(raw[3])
        this.halfMoves = Number.parseInt(raw[4]);
        this.fullMoves = Number.parseInt(raw[5]);
    }

    getCastleData(castleString){
        let castleData = {};
        castleData[Players.white] = {};
        castleData[Players.black] = {};
        
        if(castleString.search("K") != -1)
            castleData[Players.white]["k"] = true;
        if(castleString.search("Q") != -1)
            castleData[Players.white]["q"] = true;
        if(castleString.search("k") != -1)
            castleData[Players.black]["k"] = true;
        if(castleString.search("q") != -1)
            castleData[Players.black]["q"] = true;

        return castleData;
    }

    getEnPassantData(enPassatString){
        if(enPassatString != "-")
            return getLocationFromNotation(enPassatString);
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
            if(this.array[i]?.player == player)
                pieces.push(i);
        return pieces;
    }

    makeMove(from, to){
        // Takes pos64
        let piece = this.array[from];

        // Moves that change other pieces too
        // En Passant
        if(piece.type.toLowerCase() == "p" && (Math.abs(from - to) == 7 || Math.abs(from - to) == 9))
            if(this.array[to] == null)
                this.array[to - playerMultiplier(this.player) * 8] = null;

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
        // En Passant
        if(piece.type.toLowerCase() == "p")
            if(Math.abs(from - to) == 16)
                this.enPassantSquare = -1 * playerMultiplier(this.player) * 8;
        
        // Castle
        if(piece.type.toLowerCase() == "k")
            this.castleData[this.player] = {"k": false, "q":false};
        
        if(piece.type.toLowerCase() == "r")
            if(from % 8 == 0)
                this.castleData[this.player]['q'] = false;
            else if(from % 8 == 7)
                this.castleData[this.player]['k'] = false;

        // HalfMove Clock
        if(piece.type.toLowerCase() == "p" || this.array[to] != null)
            this.halfMoves = 0;
        else
            this.halfMoves += 1;

        // Fullmove
        if(this.player == Players.black)
            this.fullMoves += 1;
        
        // Player change
        this.player = changePlayer(this.player)

        this.array[to] = this.array[from]
        this.array[from] = null;

    }

    isCheck(){
        let piece;
        let kingPos = this.findPiece(this.getKing());
        let nextMoves = this.getNextMoves(false, changePlayer(this.player));
        for(piece in nextMoves)
            if(kingPos in nextMoves[piece])
                return true;
        return false;
    }

    getNextMoves(checkForCheck=true, player=this.player){
        // Outputs as pos64 
        let pieces = this.getAllPieces(player);
        let piece, moves, move;
        let validMoves = {};
        let legalMoves = {};
        pieces.forEach(piece => validMoves[piece] = this.array[piece].getAllMoves(this, piece));
        if(checkForCheck)
            for(piece in validMoves){
                moves = validMoves[piece];
                for(move of moves){
                    let board = new Board(this._fen);
                    board.makeMove(piece, move);
                    board.player = this.player;
                    if(!board.isCheck())
                        if(legalMoves[piece])
                            legalMoves[piece].push(move);
                        else
                            legalMoves[piece] = [move];

                }
            }
        else
            return validMoves;

        return legalMoves;
    }

    findPiece(piece){
        // Case sensitive(small for black, big for white)
        for(let i=0; i<64; i++)
            if(this.array[i]?.type == piece)
                return i;
    }

    getKing(){
        if(this.player == Players.black)
            return "k";
        return "K";
    }

    boardToFEN(){
        let blankSpaces = 0, fen = "";

        for(var i=0; i<64; i++){
            if(i % 8 == 0){
                if(blankSpaces)
                    fen += String(blankSpaces);
                this.blankSpaces = 0;
                fen += "/"
            }
            if(this.array[i]){
                if(blankSpaces)
                    fen += String(blankSpaces);
                this.blankSpaces = 0;
                fen += this.array[i].type;
            }
            else
                blankSpaces++;
        }
        fen += " ";

        if(this.player == Players.black)
            fen += "b";
        else
            fen += "w";

        fen += " ";

        let castleString = "";
        if(this.castleData[Players.white]['k'])
            castleString += "K";
        if(this.castleData[Players.white]['q'])
            castleString += "Q";
        if(this.castleData[Players.black]['k'])
            castleString += "k";
        if(this.castleData[Players.black]['q'])
            castleString += "q";
        fen += castleString;
        if(castleString)
            // Blank
            fen += "-";

        fen += ' ';
        
        if(this.enPassantSquare)
            // TODO convert to notation
            fen += ""
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