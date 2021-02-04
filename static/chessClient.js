const pieceToText = {
    "K": "&#x2654;",
    "Q": "&#x2655;",
    "R": "&#x2656;",
    "B": "&#x2657;",
    "N": "&#x2658;",
    "P": "&#x2659;",
    "k": "&#x265A;",
    "q": "&#x265B;",
    "r": "&#x265C;",
    "b": "&#x265D;",
    "n": "&#x265E;",
    "p": "&#x265F;",
  }
  const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";
  var board;
  let nextMoves = [];
  let selectedPiece;

  function boardToHTML(blackPerspective=false){
      $("#board").html("");
      let table = document.createElement("table");
      let currentRow;
      let trueIndex = blackPerspective ? 63 : 0;
      let trueIndexModifier = blackPerspective ? -1 : 1;
      for(i=0; i<64; i++){
          if(i % 8 == 0){
              if(currentRow)
                table.appendChild(currentRow);
              currentRow = document.createElement("tr");
          }
          
          let currentColumn = document.createElement("td");
          if((Math.floor(i/8) + (i % 8)) % 2 == 0)
              currentColumn.classList.add("light-cell");
          else
              currentColumn.classList.add("dark-cell");
          
          if(board.array[trueIndex])
              currentColumn.innerHTML = pieceToText[board.array[trueIndex].type];
          currentColumn.setAttribute("id", trueIndex);
          currentRow.appendChild(currentColumn);
          
          trueIndex += trueIndexModifier;
      }
      table.appendChild(currentRow);
      $("#board").append(table);

      nextMoves = board.getNextMoves();
  }

  function highlightMoves(index){
      let moves = nextMoves[index];
      if(moves)
          for(move of moves)
              $("#"+String(move)).addClass("highlight");
  }

  function unselect(){
      $("#" + selectedPiece).removeClass("selected");
      selectedPiece = null;
      $(".highlight").removeClass("highlight");
  }

  function getThisPlayer(){
      return sessionStorage.getItem("player");
  }

  function select(index){
      unselect();
      $("#" + index).addClass("selected");
      selectedPiece = index;
      highlightMoves(index);
  }
  
  function processClick(socket, index, Players){
      if(selectedPiece === index)
          unselect();
      else if(selectedPiece == null && board.array[index] && board.player == getThisPlayer() && board.player == board.array[index].player)
          select(index);
      else if(selectedPiece == null && board.array[index]?.player == changePlayer(getThisPlayer()))
          unselect();
      else if(board.array[index]?.player == getThisPlayer() && board.player == getThisPlayer())
          select(index);
      else if(selectedPiece != null){
          if(nextMoves[selectedPiece].includes(Number.parseInt(index))){
              // Make Move in client early
              board.makeMove(selectedPiece, index);
              postMove(Players, true);
              socket.emit("makeMove", sessionStorage.getItem("gameId"), selectedPiece, index);
          }
          else
            unselect();
          selectedPiece = null;
      }
  }

  function postMove(Players, early=false){
      boardToHTML(getThisPlayer() == Players.black);
      if(!early){
        nextMoves = board.getNextMoves();
        if(board.isCheck(sessionStorage.getItem("player")))
            alert("You're in check");
      }
  }