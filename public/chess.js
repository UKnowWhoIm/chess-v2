const Players = {
    "white": 0,
    "black": 1,
    "w": 0,
    "b": 1
}

function hasLowerCase(str) {
    return str.toUpperCase() != str;
}

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
        // Output Pos64
        let moves = [];
        for(move in this.nextNormalMoves)
            if(!checkOutOfBounds(position, move)){
                if(this.nextCaptureMoves && Piece.getPlayer(board.array[move + position]) != null)
                    continue;
                if(this.multipleMoves){
                    for(var pos = position; !checkOutOfBounds(pos, move); pos += move)
                        if(Piece.getPlayer(board.array[move + pos]) != board.player)
                            moves.push(pos);
                }
                else
                    if(Piece.getPlayer(board.array[move + position]) != board.player)
                        moves.push(position);
            }
            

        // Capture Moves(Pawn)
        for(move in this.nextCaptureMoves)
            if(!checkOutOfBounds(position, move) && Piece.getPlayer(board.array[move + position]) == changePlayer(board.player))
                moves.push(move);

        moves.push(...this.getSpecialMoves(board, position));
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
        this.nextNormalMoves = [playerMultiplier(this.player) * 8];

        this.nextCaptureMoves = [
            playerMultiplier(this.player) * 8 + 1,
            playerMultiplier(this.player) * 8 - 1,
        ];
    }

    getSpecialMoves(board, position){
        let startingCol = {}, moves = [];
        startingCol[Players.white] = 6;
        startingCol[Players.black] = 1;
        
        if(startingPosition[this.player] == Math.floor(position / 8))
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
        super(type, [17, 10, 15, 6, -6, -15, -10, -17], null, false);
    }
}

class Bishop extends Piece{
    constructor(type){
        super(type, [-7, 7, 9, -9], null, true);
    }
}

class Rook extends Piece{
    constructor(type){
        super(type, [8, -8, -1, 1], null, true);
    }
}

class Queen extends Piece{
    constructor(type){
        super(type, [8, -8, -1, 1, -7, 7, 9, -9], null, true);
    }
}

class King extends Piece{
    constructor(type){
        super(type, [8, -8, -1, 1, -7, 7, 9, -9], null, false);
    }

    getSpecialMoves(board, position){
        let moves = []
        if(board.castleData[Players[board.player]]['k'])
            if(board.array[position + 1] == null && board.array[position + 2] == null 
                && !board.isCheck())
                    moves.push(position + 2);
        
        if(board.castleData[Players[board.player]]['q'])
            if(board.array[position - 1] == null && board.array[position - 2] == null  && board.array[position - 3]
                && !board.isCheck())
                    moves.push(pos - 2);
        
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

class Board{
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
            return Board.getLocationFromNotation(enPassatString);
    }

    static getLocationFromNotation(notation){
        // e6 -> [2, 4]
        const col = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7};
        return [ 8 - String.parseInt(notation[1]) , col[notation[0]]];
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

    static getAllPieces(board, player){
        // outputs pos64
        let pieces = [];
        for(var i=0; i<64; i++) 
            if(board[i] && board[i].player == Players[player])
                pieces.push(i);
        return pieces;
    }

    makeMove(from, to){
        // Takes pos64
        let piece = this.array[from];

        // Moves that change other pieces too
        // En Passant
        if(piece.type.toLowerCase() == "p" && Math.abs(from - to) == 7 || Math.abs(from - to) == 9)
            if(this.array[to] == null)
                this.array[to - playerMultiplier(this.player) * 8] = null;

        // Castling
        if(piece.type.toLowerCase() == "k"){
            if(from - to == 2){
                // Queen
                board.array[from - 1] = board.array[from - 4];
                board.array[from - 4] = null;
            }
            else if(from - to == -2){
                // King
                board.array[from + 1] = board.array[from + 3];
                board.array[from + 3] = null;
            }
        }

        // Update board state
        // En Passant
        if(piece.type.toLowerCase() == "p")
            if(Math.abs(from - to) == 16)
                this.enPassantSquare = -1 * playerMultiplier(this.player) * 8;
        
        // Castle
        if(piece.type.toLowerCase() == "k")
            this.castleData[this.player] == {"k": false, "q":false};
        
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
        let kingPos = this.findPiece(getKing());
        let nextMoves = this.getNextMoves(checkForCheck=false, changePlayer(this.player));
        for(const [piece, moves] in Object.entries(nextMoves))
            if(kingPos in moves)
                return true;
        return false;
    }

    getNextMoves(checkForCheck=true, player=this.player){
        // Outputs as pos64 
        let pieces = Board.getAllPieces(this.array, player);
        let validMoves = {};
        let legalMoves = {};

        pieces.forEach(piece => validMoves[piece] = this.array[piece].getAllMoves(piece));

        if(checkForCheck)
            for([piece, moves] in Object.entries(validMoves))
                for(i=0; i<moves.length; i++){
                    let board = new Board(this._fen);
                    board.makeMove(piece, moves[i]);
                    if(!board.isCheck())
                        if(legalMoves.hasOwnProperty(piece))
                            legalMoves[piece].push(moves[i]);
                        else
                            legalMoves[piece] = [moves[i]];

                }
        else
            legalMoves = validMoves;

        return legalMoves;
    }

    findPiece(piece){
        // Case sensitive(small for black, big for white)
        for(i=0; i<64; i++)
            if(this.array[i].type == piece)
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

function getCoordinates(position){
    return [Math.floor(position / 8), (position % 8) * position/Math.abs(position)];
}

function changePlayer(player){
    if(player == Players.black) 
        return Players.white;
    return Players.black;
}

function playerMultiplier(player){
    if(player == Players.black)
        return -1;
    return 1;
}

function isLeftEdge(position){
    return position % 8 == 0;
}

function isRightEdge(position){
    return position % 8 == 7;
}

function checkOutOfBounds(currentPos, nextMove){
    currentCoordinate = getCoordinates(currentPos);
    nextCoordinate = getCoordinates(nextMove);

    return !(0 <= currentCoordinate[0] + nextCoordinate[0] <= 7 &&
        0 <= currentCoordinate[1] + nextCoordinate[1] <= 7);
}