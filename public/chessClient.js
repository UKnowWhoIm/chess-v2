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

  function boardToHTML(){
      $("#board").html("");
      let table = document.createElement("table");
      let currentRow;
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
          
          if(board.array[i])
              currentColumn.innerHTML = pieceToText[board.array[i].type];
          currentColumn.setAttribute("id", i);
          currentRow.appendChild(currentColumn);
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

  function getCurrentPlayer(){
      return sessionStorage.getItem("player");
  }

  function select(index){
      unselect();
      $("#" + index).addClass("selected");
      selectedPiece = index;
      highlightMoves(index);
  }
  
  function processClick(socket, index){
      if(selectedPiece === index)
          unselect();
      else if(selectedPiece == null && board.array[index] && board.player == getCurrentPlayer() && board.player == board.array[index].player)
          select(index);
      else if(selectedPiece == null && board.array[index]?.player == changePlayer(getCurrentPlayer()))
          unselect();
      else if(board.array[index]?.player == getCurrentPlayer() && board.player == getCurrentPlayer())
          select(index);
      else if(selectedPiece != null){
          if(!nextMoves[selectedPiece])
              unselect();
          if(nextMoves[selectedPiece].includes(Number.parseInt(index))){
              socket.emit("makeMove", sessionStorage.getItem("gameId"), selectedPiece, index);
          }
          selectedPiece = null;
      }
  }

  function postMove(){
      boardToHTML();
      nextMoves = board.getNextMoves();
      if(board.isCheck(sessionStorage.getItem("player")))
          alert("You're in check");
  }