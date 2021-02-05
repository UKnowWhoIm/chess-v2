const utils = require("./Utils");

class Piece{
    constructor(type, nextNormalMoves, nextCaptureMoves, multipleMoves){
        this.type = type;
        this.player = Piece.getPlayer(type);
        this.nextNormalMoves = nextNormalMoves;
        this.nextCaptureMoves = nextCaptureMoves;
        this.multipleMoves = multipleMoves;
    }

    getSpecialMoves(board, position, args){
        // Outputs absolute position
        return [];
    }

    getAllMoves(board, position, splMoveArgs={"checkForCheck": true}){
        /**
         * Converts to coordinates(2d) and processes as utils.checkOutOfBounds logic is in 2d
         * Otherwise will lead to confusing choices when -ve numbers come to play
         * eg: for N -> actual move [2, -1] => 15 => [1, 7] (in utils.checkOutOfBounds)
         * Similary for [1, -1] => 7 => [0, 7]
         * 
         * Final moves are always +ve so it is unaffected
         */
        position = Number.parseInt(position);
        let positionCoord = utils.getCoordinates(position);
        let moves = [];
        this.nextNormalMoves.forEach((move) => {
            if(!utils.checkOutOfBounds(positionCoord, move)){
                if(this.nextCaptureMoves == null || board.array[utils.getPosition(utils.addCoordinates(move, positionCoord))] == null){                    
                    if(this.multipleMoves){
                        for(var pos = positionCoord; !utils.checkOutOfBounds(pos, move); pos = utils.addCoordinates(move, pos)){
                            if(board.array[utils.getPosition(utils.addCoordinates(move, pos))] == null || board.array[utils.getPosition(utils.addCoordinates(move, pos))].player != this.player)
                                moves.push(utils.getPosition(utils.addCoordinates(move, pos)));
                            if(board.array[utils.getPosition(utils.addCoordinates(move, pos))] != null)
                                // Encountered a piece
                                break;
                        }
                    }
                    else if(board.array[utils.getPosition(utils.addCoordinates(move, positionCoord))] == null || board.array[utils.getPosition(utils.addCoordinates(move, positionCoord))].player != this.player)
                        moves.push(utils.getPosition(utils.addCoordinates(move, positionCoord)));
                }
            }
        });
        // Capture Moves(Pawn)
        if(this.nextCaptureMoves != null)
            this.nextCaptureMoves.forEach(move =>{
                if(!utils.checkOutOfBounds(positionCoord, move) && board.array[utils.getPosition(utils.addCoordinates(move, positionCoord))] && board.array[utils.getPosition(utils.addCoordinates(move, positionCoord))].player == utils.changePlayer(this.player))
                    moves.push(utils.getPosition(utils.addCoordinates(move, positionCoord)));
            });

        this.getSpecialMoves(board, position, splMoveArgs).forEach(move=>moves.push(move));

        return moves;
    }

    static getPlayer(piece){
        if (piece == null)
            return null;
        if(utils.hasLowerCase(piece))
            return utils.Players.black;
        return utils.Players.white
    }

}

class Pawn extends Piece{
    constructor(type){
        super(type, [], null, false);
        this.setNextMoves();
    }

    setNextMoves(){
        this.nextNormalMoves = [[utils.playerMultiplier(this.player), 0]];

        this.nextCaptureMoves = [
            [utils.playerMultiplier(this.player), 1],
            [utils.playerMultiplier(this.player), -1],
        ];
    }

    getSpecialMoves(board, position, args){
        let startingCol = {}, moves = [];
        startingCol[utils.Players.white] = 6;
        startingCol[utils.Players.black] = 1;
        if(startingCol[this.player] == Math.floor(position / 8))
            if(!board.array[position + utils.playerMultiplier(this.player) * 16] && !board.array[position + utils.playerMultiplier(this.player) * 8])
                moves.push(position + utils.playerMultiplier(this.player) * 16);

        if(board.enPassantSquare){
            let nextRow = utils.playerMultiplier(this.player) * 8;

            if(board.enPassantSquare == position + nextRow + 1 && !utils.isRightEdge(position) || 
            board.enPassantSquare == position + nextRow - 1 && !utils.isLeftEdge(position))
                
                moves.push(board.enPassantSquare);
        }

        return moves;
    }
}

class Knight extends Piece{
    constructor(type){
        super(type, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [2, -1], [2, 1], [1, 2], [1, -2]], null, false);
    }
}

const diagonalMoves = [[1, -1], [-1, 1], [-1, -1], [1, 1]];
const horizontalMoves = [[1, 0], [-1, 0], [0, -1], [0, 1]];

class Bishop extends Piece{
    constructor(type){
        super(type, diagonalMoves, null, true);
    }
}

class Rook extends Piece{
    constructor(type){
        super(type, horizontalMoves, null, true);
    }
}

class Queen extends Piece{
    constructor(type){
        super(type, horizontalMoves.concat(diagonalMoves), null, true);
    }
}

class King extends Piece{
    constructor(type){
        super(type, horizontalMoves.concat(diagonalMoves), null, false);
    }

    getSpecialMoves(board, position, args){
        let moves = [];
        if(board.castleData[this.player]['k'])
            if(board.array[position + 1] == null && board.array[position + 2] == null)
                if((args.checkForCheck && !board.isCheck(this.player)) || !args.checkForCheck)
                    moves.push(position + 2);
        
        if(board.castleData[this.player]['q'])
            if(board.array[position - 1] == null && board.array[position - 2] == null  && board.array[position - 3] == null)
                if((args.checkForCheck && !board.isCheck(this.player)) || !args.checkForCheck)
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

module.exports = {
    PieceMap: PieceMap,
    Piece: Piece
};