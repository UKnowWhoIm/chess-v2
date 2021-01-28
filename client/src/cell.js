import React from "react";

const pieceToText = {
    "K": 0x2654,
    "Q": 0x2655,
    "R": 0x2656,
    "B": 0x2657,
    "N": 0x2658,
    "P": 0x2659,
    "k": 0x265A,
    "q": 0x265B,
    "r": 0x265C,
    "b": 0x265D,
    "n": 0x265E,
    "p": 0x265F,
}

export class Cell extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            "highlight": false,
            "selected": false,
        }
    }
    
    getBackgroundColor(){
        if(this.state.selected)
            return "orange";
        if(this.state.highlight)
            return "chocolate";
        return this.props.color;
    }

    getStyles(){
        return {
            backgroundColor: this.getBackgroundColor(),
            height: 60,
            width: 60,
            fontSize: 48,
            textAlign: "center",
            fontFamily: "Arial"
        }
    }

    select = () => this.setState({"selected": true, "highlight": false});
    highlight = () => this.setState({"selected": false, "highlight": true});

    render(){
        return <td style={this.getStyles()}>{this.props.piece ? String.fromCodePoint(pieceToText[this.props.piece?.type]) : ""}</td>
    }
}