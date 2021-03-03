const Players = {
    "white": 0,
    "black": 1,
    "w": 0,
    "b": 1
};

let hasLowerCase = (str) => String(str).toUpperCase() != str;

let getCoordinates = (position) => [Math.floor(position / 8), (position % 8)];

let getPosition = (coordinates) => coordinates[0] * 8 + coordinates[1];

let addCoordinates = (cood1, cood2) => [cood1[0]*1 + cood2[0], cood1[1]*1 + cood2[1]];

let isLeftEdge = (position) => position % 8 == 0;

let isRightEdge = (position) => position % 8 == 7;

function getLocationFromNotation(notation){
    // e6 -> [2, 4] -> 20
    const col = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7};
    return getPosition([8 - Number.parseInt(notation[1]) , col[notation[0]]]);
}

function getNotationFromPosition(position){
    // 20 -> [2, 4] -> e6
    let coordinate = getCoordinates(position);
    return String.fromCharCode(coordinate[1] + 97) + String(8 - coordinate[0]) ;
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
    resultCoordinate = addCoordinates(currentCoordinate, nextCoordinate);

    if(resultCoordinate[0] > 7 || resultCoordinate[1] > 7)
        return true;
    if(resultCoordinate[0] < 0 || resultCoordinate[1] < 0)
        return true;
    return false;
}

module.exports = {
    Players: Players,
    checkOutOfBounds: checkOutOfBounds,
    playerMultiplier: playerMultiplier,
    getCoordinates: getCoordinates,
    hasLowerCase: hasLowerCase,
    getNotationFromPosition: getNotationFromPosition,
    getLocationFromNotation: getLocationFromNotation,
    changePlayer: changePlayer,
    isLeftEdge: isLeftEdge,
    isRightEdge: isRightEdge,
    addCoordinates: addCoordinates,
    getPosition: getPosition,
};