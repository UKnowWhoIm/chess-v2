import {React} from "react";
import {Cell} from "./cell";

export function boardAsHTML(props){ 
    let currentRow=[], table=[], color;
    for(let i=0; i<64; i++){
        if(i % 8 === 0){
            if(currentRow)
                table.push(<tr>{currentRow}</tr>);
            currentRow = [];
        }
        if((Math.floor(i/8) + (i % 8)) % 2 === 0)
            color = "grey";
        else
            color = "lightblue";
        let currentCell = new Cell({"piece": props.board.array[i], "color": color});
        currentRow.push(currentCell.render());
        console.log(currentRow);
    }
    table.push(<tr>{currentRow}</tr>);
    return <table style={{margin: "auto"}}><tbody>{table}</tbody></table>
}