# Chess

This is a browser based multiplayer chess engine written in Node.

## Table Of Contents
- [How does it work](#how-does-it-work)?
    - [Basic Workflow](#basic-workflow)
- [Chess Logic](#chess-logic)
    - [Storing Board State](#storing-the-board-state)
    - [The Piece Classes](#the-piece-classes)
    - [The Board Class](#the-board-class)
    - [Move Validation](#move-validation)
    - [Pawn Promotion](#pawn-promotion)
- [Socket Events](#socket-events)

## How does it work?

- Express hosts the server
- Using Sockets.io, real time communication between server and clients could be achieved through events.
- The server stores the details of each room in a MongoDB.

### Basic Workflow

- If the player creates a room, a new document is created in DB and a new room is allocated to the player. 
- Joining or creating a room will lead to the getGameId event, which sends the gameId to the client.
- After 2 players are in a room, the game automatically starts.
- Each move made by the player is sent to the server using makeMove event. 
- The board state is read from the db and the move is validated. The board is sent to the listening clients through updateBoard event.
- This goes on until the game is over through victory or draw.
- After the game is over, the game's details are removed from DB.

## Chess Logic

The chess logic run by the server is stored in /server/chess/. The client side does not support exports and require, so it is separately maintained in /static/chessBrowser.js.

### Storing the board state

[FEN notation](https://www.chess.com/terms/fen-chess) is used to store the board state in db. The only disadvantage is it can't store pawn promotion data, so it has to be separately maintained.

### The Piece Classes

All the pieces extend the Base Class `Piece`.

The `Piece` Class

| Member | Overriden | Usage |
| --- | --- | --- |
| type | yes | The string representation |
| player | no | The owner of this piece |
| nextNormalMoves | yes | The directions for the next moves |
| nextCaptureMoves | yes | The directions for the next capture moves(Pawn Only) |
| multipleMoves | yes | Whether this piece can move multiple columns |
| getSpecialMoves() | yes | Return the absoule positions of this piece's special moves | 
| getAllMoves() | no | Return the next moves based on the attributes |
| getPlayer() | no | Get the owner of the provided piece |

#### getSpecialMoves(board, position, args)

Takes a board Object, the position(Integer), and additional args(dictionary) required for special Moves. This should be implemented by Pieces having special moves like Pawn(En Passant, Double First Move) and King(Castling).

#### getAllMoves(board, position, splMoveArgs)

Takes a board Object, the position(Integer), and additional args(dictionary) required for special Moves. This generates the next moves of a particular piece based on nextNormalMoves, nextCaptureMoves, getSpecialMoves(), and multipleMoves.

### The Board Class

This Class is mainly used to represent the board state, to perform move generation, make moves and check game over.

#### Representing positions of the pieces

The positions of the pieces is represented in an array of length 64. Empty columns are marked null.

#### Move generation using getNextMoves(checkForCheck=true, player=this.player) function.

1. Get all pieces of the `player` from the board and store them by mapping to their position.
2. For each piece in pieces call `piece.getAllMoves()`, and store them to `validMoves` by mapping to their position.
3. If checkForCheck is false, return `validMoves`
4. Else check if move is legal by making the move and checking if this player is in check.
5. If not in check add to `legalMoves[position]`.
5. return `legalMoves`.

#### isCheck(player=this.player) function.

1. Get the position of `player`'s king.
2. Get all moves of the enemy by `this.getNextMoves(false, changePlayer(player))`. `checkForCheck` is set to `false` to avoid infinite recursion.
3. If any enemy piece can move to the king's location, the player is in check.

#### makeMove(from, to) function

This function makes the actual changes to the `array` property. It also changes the properties like `enPassantSquare`, `castleData`, etc according to the move

#### Game Over Conditions
1. A Player has won -> Enemy has no legal moves and is in check(checkVictory function)
2. The game is drawn(checkDraw function)
    - Stalemate: The enemy has no legal moves but isn't in check.(checkStalemate function)
    - 50 move rule: Game is automatically drawn after 50 consecutive halfmoves.
    - Insufficent Material: TODO
    - Mutual Agreement: TODO
3. A Player has resigned: TODO

### Move Validation

Currently move is validated outside the chess core files.

Server Side -> [socketEvents](/server/socketEvents.js)

Client Side -> [chessClient](/static/chessClient.js)

The Logic
1. Generate NextMoves
2. Check if this move in NextMoves.

### Pawn Promotion

1. The `makeMove` function will set the `Board.pawnPromotion` attribute if eligible for pawn promotion. The player won't be changed if eligible.

2. The server will send a `startPawnPromotion` event to the room. The eligible player has to pick a piece for promotion. No other moves are allowed. The promotionData would be written to the db.

3. On choosing a piece the client would send a `promotePawn` event to the server. Which would in turn send a `successPawnPromotion` or `errorPawnPromotion` event back based on the promotionData stored by the db.

4. On `successPawnPromotion`, the game will resume and the other player gets their turn.

## Socket Events

All server side socket handling is located in [socketEvents.js](/server/socketEvents.js)

All client side socket handling is located in [index.html](/public/index.html)

| Event | Emitter | Data | Functionality |
| --- | --- | --- | --- |
| `roomCreate` | Client | null | Indicate to the server a new room has been created. |
| `roomJoin` | Client | null | Indicate to the server a new player has joined the room. |
| `getGameId` | Server | gameId | Emit the game Id to the client. |
| `startCountDown` | Server | null | Emit to the room to start the countdown. |
| `coutdownFinished` | Client | gameId | Emit to the server that coutdown has finished. |
| `endCountDownDisconnect` | Server | null | Emit to the room that countdown must be stopped due to a disconnecting player |
| `startGame` | Server | initialBoard | Emit to the room to start the game. |
| `playerColor` | Server | color | Emit the color of the client to the client. |
| `invalidRoomId` | Server | null | Emit that the room id is invalid to the client. |
| `makeMove` | Client | gameId, from, to | Emit the move made by the player to server. |
| `boardUpdated` | Server | fen | Emit the current board state to the room. |
| `invalidMove` | Server | null | Emit to indicate the proposed move is invalid. |
| `victory` | Server | player | Emit to the room, that `player` is the winner. |
| `draw` | Server | null | Emit to the room that the game has been drawn. |
| `startPawnPromotion` | Server | player | Emit to the room that `player` can promote a pawn. |
| `successPawnPromotion` | Server | null | Emit to the client that Pawn Promotion is successfull.|
| `errorPawnPromotion` | Server | null | Emit to the client that Pawn Promotion Failed. |
| `promotePawn` | Client | gameId, piece | Emit to the server that the client requests to promote the pawn to `piece` |
| `playerDisconnect` | Server | null | Emit to the room that a player has disconnected. |
| `endGameDisconnect` | Server | null | Emit to the room that the current game has ended due to a player being disconnected. |
