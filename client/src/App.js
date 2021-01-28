import { Component } from 'react';
import {Board} from './chess';
import {boardAsHTML} from './board';

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      "board" : new Board(initialFen),
      "selectedPiece": null,
    }
  }
  render(){
      return boardAsHTML({"board": this.state.board});
  }
}

export default App;
