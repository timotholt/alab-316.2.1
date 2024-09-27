console.log(`hello world from alab316.2.1`);

// Get current window shape
const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;

// Create audio object for the main music played in the game
const rescueMusic = new Audio(`./rescue.mp3`);
const rescueVolume = 0.3;
rescueMusic.volume = rescueVolume;

// Create audio object for the victory music
const victoryMusic = new Audio(`./ff14-fanfare.mp3`);
const victoryVolume = 1.0;
victoryMusic.volume = victoryVolume;

let musicStarted = false;

//================================================
// Tom Cruise's cues
//================================================

const cueManOverboard = new Audio(`./startrescue.mp3`);
const cueManSpotted   = new Audio(`./crashsitespotted.mp3`);
const cueManLost      = new Audio(`./crashsitelost.mp3`);
const cueManRescued   = new Audio(`./gooserescued.mp3`);
const cueMovingAway   = new Audio(`./farsonar.mp3`);
const cueMovingCloser = new Audio(`./closesonar.mp3`);

// force window to be a certain size
let gameHeight = 10;
let gameWidth = 10;
window.resizeTo(gameWidth, gameHeight);

// Map and map symbols
const terrainMap = [gameWidth];
const wave = `\u{A540}`;                    // Turbulent water
const island = `\u{1FAA8}`;                 // Land / rocks
const plane = `\u{2708}`;                   // Crash site
const blank = ' ';                          // Empty water
const numIslands = 7;
const numWaves = 10;

// To draw the ship and swimmer
const man = `\u{1f3ca}`;                    // Man
const ship = `\u{1F6A2}`;                   // The ship you drive around
const swimmer = plane + man;                // Crash site
const ring = `\u{1F6DF}`;                   // The life preserver
const rescued = ship + ring + swimmer;      // Combination of all 3

// Random number
const randomInt = (max) => Math.floor(Math.random() * max); 
const randRow = () => randomInt(gameHeight);
const randCol = () => randomInt(gameWidth);

// Distance from ship to swimmer
const distanceOnTop = 0;          // Ship on top of the swimmer
const distanceIsClose = 3;        // <= 3 is close
const distanceIsMedium = 6;       // <= 5 is medium

// Starting coords of ship and swimmer
let shipRow = 0;
let shipCol = 0;
let swimmerRow = gameHeight - 1;
let swimmerCol = gameWidth - 1;

// Change background color of x,y
function changeText(row, col, text){

    // console.log(`changeText(${row},${col},"${text}")`);
    let address = `r${row}-c${col}`;
    // console.log(`Changing the text of cell ${address}`);

    let cell = document.getElementById(address);
    // console.log(`document.getElementById(${address}) returned ${cell}`);
    // if (color)
    //     cell.style.backgroundColor = color;

    cell.innerHTML = text;
}

// draw the ship to specified row/col
// Intentionally global
let lastDrawnShipRow = -1;
let lastDrawnShipCol = -1;
let newShipRow = 0;
let newShipCol = 0;

function drawShip() {

    // If the ship has different coordinates from what we last drew it at...
    if ((lastDrawnShipRow !== shipRow) || (lastDrawnShipCol !== shipCol)){

        // Remove old ship location if the old location is valid (not -1)
        if (lastDrawnShipRow >= 0 && lastDrawnShipCol >= 0) {
            // console.log(`Erasing old ship location because it was last drawn at ${lastDrawnShipRow} ${lastDrawnShipCol}`);
            // console.log(`calling change text with lastDrawnShipRow = ${lastDrawnShipRow} lastDrawnShipCol = ${lastDrawnShipCol} ${blank}`);
            changeText(lastDrawnShipRow, lastDrawnShipCol, blank);
            // changeText(lastDrawnShipRow, lastDrawnShipCol, terrainMap[lastDrawnShipRow][lastDrawnShipCol] + blank);
        };

        // Draw the ship at the new spot
        // console.log(`Drawing ship at ${shipRow} ${shipCol}`);

        // console.log(`Calling change text with shipRow = ${shipRow} shipCol = ${shipCol} ${blank}`);
        
        if (distanceBetweenShipAndSwimmer() === 0) {
            // changeText(shipRow, shipCol, terrainMap[shipRow][shipCol] + rescued);
            changeText(shipRow, shipCol, rescued)
        }
        else{
            // changeText(shipRow, shipCol, terrainMap[shipRow][shipCol] + ship);
            changeText(shipRow, shipCol, ship);
        }

        lastDrawnShipRow = shipRow;
        lastDrawnShipCol = shipCol;
    }
}

// Intentionally global
let lastDrawnSwimmerRow = swimmerRow;
let lastDrawnSwimmerCol = swimmerCol;
let swimmerVisible = false;
let sailorName = null;

function drawSwimmer() {

    // Draw swimmer at new spot if the ship is within a certain distance
    if (distanceBetweenShipAndSwimmer() <= distanceIsClose) {

        // if the swimmer was visible the last time we drew him, erase the old spot
        if (swimmerVisible) {

            return;

            // console.log(`1. Erasing old swimmer location because it was last drawn at ${lastDrawnSwimmerRow} ${lastDrawnSwimmerCol}`);
            changeText(lastDrawnSwimmerRow, lastDrawnSwimmerCol, terrainMap[lastDrawnSwimmerRow][lastDrawnSwimmerCol] + blank);
            lastDrawnSwimmerRow = swimmerRow;
            lastDrawnSwimmerCol = swimmerCol;
            swimmerVisible = false;
        }

        changeText(swimmerRow, swimmerCol, terrainMap[swimmerRow][swimmerCol] + swimmer);
        // console.log(`2. Drawing swimmer at ${lastDrawnSwimmerRow} ${lastDrawnSwimmerCol}`);
        lastDrawnSwimmerRow = swimmerRow;
        lastDrawnSwimmerCol = swimmerCol;
        swimmerVisible = true;

        // Play man spotted
        cueManSpotted.currentTime = 0;
        cueManSpotted.play();                    
    }

    // Otherwise boat is too far away to see the swimmer
    else {

        // If the swimmer is visible, hide him
        if (swimmerVisible) {
            console.log(`3. Erasing old swimmer location because it was last drawn at ${lastDrawnSwimmerRow} ${lastDrawnSwimmerCol}`);
            // changeText(lastDrawnSwimmerRow, lastDrawnSwimmerCol, terrainMap[lastDrawnSwimmerRow][lastDrawnSwimmerCol] + blank);
            changeText(lastDrawnSwimmerRow, lastDrawnSwimmerCol, blank);
            lastDrawnSwimmerRow = swimmerRow;
            lastDrawnSwimmerCol = swimmerCol;
            swimmerVisible = false;

            // Play man spotted
            cueManLost.currentTime = 0;
            cueManLost.play();
        }
    }
}

function distanceBetween(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    
    return Math.abs(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
}

function distanceBetweenShipAndSwimmer() {
    return (distanceBetween(shipCol, shipRow, swimmerCol, swimmerRow));
}


// Event handler
function handleClick(event) {

    event.stopPropagation();

    // console.log(`Event target ID = ${event.target.id}`);

    // Skip events that are useless to us
    if (event.target.id === `app`)
        return;

    // Skip rows
    if (event.target.id.substring(0, 3) === `row`)
        return;

    // If the target isn't a app without a row/col, skip it
    // Get the cell row and column that was clicked
    let indexCol = event.target.id.indexOf(`c`);
    sRow = event.target.id.substring(1, indexCol-1);
    sCol = event.target.id.substring(indexCol+1);

    // If the distance is more >= 2 then it's an illegal move
    if (distanceBetween(sRow, sCol, shipRow, shipCol) >= 2)
        return;

    // Move the ship
    // console.log(`${event.target.id} (row ${sRow}, col ${sCol}) was clicked:`, event);
    
    // Can't move the ship into an island
    if (terrainMap[sRow][sCol] === blank) {
        newShipCol = sCol;
        newShipRow = sRow;
    };
}

// 
function createGameBoard() {

    const appDiv = document.getElementById(`app`);

    // Erase any existing children DIVs
    appDiv.replaceChildren();

    // Make a blank map
    for (let row = 0; row < gameHeight; row++) {
        terrainMap[row] = [];
        for (let col = 0; col < gameWidth; col++) {
            terrainMap[row][col] = blank;
        }
    }

    // Randomize the waves
    for (let i = 0; i < numWaves; i++) {
        let row = randRow();
        let col = randCol();
        terrainMap[row][col] = wave;
    }

    // Randomize the islands
    for (let i = 0; i < numIslands; i++) {
        let row = randRow();
        let col = randCol();
        terrainMap[row][col] = island;
    } 

    // Make one div per board square
    for (let row = 0; row < gameHeight; row++) {

        // Calulate the name of the row
        let rowId = "row" + row;

        // make a div for the row
        const rowElement = document.createElement(`div`);
        rowElement.id = rowId;
        rowElement.style.display = "grid";
        rowElement.style.height = "5em";
        console.log(rowElement.id);
        colString = ``;

        // Debug stuff
        // rowElement.backgroundColor = "red";
        // rowElement.color = "white";
        // rowElement.innerHTML = rowId;

        // Make the columns
        for (let col = 0; col < gameWidth; col++) {
            colString += '1fr ';

            const colElement = document.createElement(`div`);
            let cellId = "r" + row + "-c" + col;
            console.log(cellId);

            colElement.className = 'cell';
            colElement.id = cellId;
            // colElement.innerHTML = cellId;

            // Copy any islands or waves
            colElement.innerHTML = terrainMap[row][col];
            console.log(colElement.innerHTML);

            // Add mouse click event handler to every cell
            // colElement.addEventListener("click", handleClick);
            
            // Add new cell to the row
            rowElement.appendChild(colElement);
        }
        
        // Add the row to the screen
        rowElement.id = rowId;
        rowElement.className = 'row';
        rowElement.style.gridTemplateColumns = colString;
        appDiv.appendChild(rowElement);
    }

    // Add mouse click event for the entire app
    appDiv.addEventListener("click", handleClick);

    const rowElement = document.createElement(`div`);
}

let lastDistance = 100000000000;

// Init game state
function initGameState() {

    // For proper audio cues
    lastDistance = 100000000000;
    swimmerVisible = false;

    // Start the music if the user already played a round
    if (musicStarted) {
        // Stop the victory music
        // victoryMusic.pause();
        victoryMusic.volume = 0;
        victoryMusic.currentTime = 0;
        victoryMusic.play();

        // Start the rescule music
        rescueMusic.currentTime = 0;
        rescueMusic.volume = rescueVolume;
        rescueMusic.play();

        // Play man overboard
        cueManOverboard.currentTime = 0;
        cueManOverboard.play();                    
    }


    // debugger;

    // Create map
    createGameBoard();

    // Keep trying to place the ship on the board, don't place it on an island
    for (let validShipRC = false; !validShipRC; ) {
        
        // The ship starts randomly at the edge of the board
        // 0 = top, 1 = right, 2 = bottom, 3 = right
        switch (randomInt(4)) {

            // Top row
            case 0:
                shipRow = 0; 
                shipCol = randCol();
                console.log(`Ship at top row`); 
                break;

            // Right column
            case 1:
                shipCol = gameWidth - 1;
                shipRow = randRow(); 
                console.log(`Ship at right column`); 
                break;

            // Bottom row
            case 2:
                shipRow = gameHeight - 1;
                shipCol = randCol();
                console.log(`Ship at bottom row`); 
                break;

            // Left column
            case 3: shipCol = 0; shipRow = randRow(); 
            console.log(`Ship at left column`); 
            break;
        }

        // debugger;
        switch (terrainMap[shipRow][shipCol]) {
            case island:
            case wave:
                continue;
    
            default: 
                validShipRC = true;
                break;
            // case blank:
            //     validShipRC = true;
            //     break;
        }
    }

    // Place the swimmer in a random spot, make sure the swimmer is
    // at least a medium distance away

    for (let validSwimmerRC = false; !validSwimmerRC; ) {
        
        console.log(`Randomizing swimmer position`);

        swimmerRow = randRow();
        swimmerCol = randCol();

        // If distance is too close, continue
        if (distanceBetweenShipAndSwimmer() < distanceIsMedium)
            continue;

        // If it's a blank spot, and its far away from the ship, the swimmer can go there
        if (terrainMap[swimmerRow][swimmerCol] === blank) 
            validSwimmerRC = true;
    };

    newShipRow = shipRow;
    newShipCol = shipCol;

    console.log(`ship row/col = ${shipRow} / ${shipCol}`);
    console.log(`swimmer row/col = ${swimmerRow} / ${swimmerCol}`);

    drawShip();
    drawSwimmer();
}

// This is the main game loop
let gameLoopCount = 0;
let displayMessageOnGameLoopNum = -1;

function gameLoop() {

    // Did ship move?
    if ((newShipRow !== shipRow) || (newShipCol !== shipCol)) {

        console.log(`${gameLoopCount}: ship moved from (${shipRow},${shipCol}) to (${newShipRow},${newShipCol}). Swimmer at (${swimmerRow},${swimmerCol})`);

        // yes ship moved
        shipRow = newShipRow;
        shipCol = newShipCol;

        // Start audio
        if (musicStarted === false) {
            musicStarted = true;

            // Play man overboard
            cueManOverboard.currentTime = 0;
            cueManOverboard.play();            

            // Start the rescue music
            rescueMusic.currentTime = 0;
            rescueMusic.play();

            // Start the victory music at zero volume
            victoryMusic.volume = 0;
            victoryMusic.currentTime = 0;
            victoryMusic.play();
        }

        // Draw the screen
        drawSwimmer();
        drawShip();
    }

    let distance = distanceBetweenShipAndSwimmer();
    
    // Check if we rescued the swimmer
    if (distance === 0) {

        console.log(`Same square as swimmer!`);

        // Start a timer
        if (displayMessageOnGameLoopNum === -1) {
            displayMessageOnGameLoopNum = gameLoopCount + 150;
        }

        else if (gameLoopCount >= displayMessageOnGameLoopNum) {
            // Stop the rescue music
            // rescueMusic.pause();
            rescueMusic.volume = rescueVolume;
            rescueMusic.currentTime = 0;
            rescueMusic.play();

            // Start the victory music
            victoryMusic.currentTime = 0;
            victoryMusic.volume = victoryVolume;
            victoryMusic.play();

            // Play man rescued
            cueManRescued.currentTime = 0;
            cueManRescued.play();
    
            window.alert(`You have rescued sailor ${sailorName}!`);
            initGameState();
            window.requestAnimationFrame(gameLoop);
            displayMessageOnGameLoopNum = -1;
        }
    }

    else {

        // If the ship moved closer to the sailor
        if (distance < lastDistance) {
            if (musicStarted) {
                // we are getting closer
                volume = Math.max(1, (gameWidth - distance) / gameWidth) - 0.2;
                // console.log(`volume = ${volume}`);
                cueMovingCloser.volume = volume;
                cueMovingCloser.currentTime = 0;
                cueMovingCloser.play();
            }
            lastDistance = distance;
        }

        // If the ship moved away from the sailor
        else if (distance > lastDistance) {

            if (musicStarted) {
                // we are getting closer
                volume = Math.max(1, (gameWidth - distance) / gameWidth - 0.2);
                // console.log(`volume = ${volume}`);
                cueMovingAway.volume = volume;
                cueMovingAway.currentTime = 0;
                cueMovingAway.play();
            }
            lastDistance = distance;
        }
    }

    console.log(`Game loop: distance is ${distance}.  Ship (${shipRow},${shipCol}), swimmer (${swimmerRow},${swimmerCol})`);
    gameLoopCount++;
    window.requestAnimationFrame(gameLoop);
}

//=============================

initGameState();


// Draw the ship only
drawShip(shipRow, shipCol);
drawSwimmer(swimmerRow, swimmerCol);

// // Show the instructions
window.alert(
    `Rescue ${ring}Goose!\n\n` +
    `Maverick and Goose ${man} ejected from their badly damaged ${plane} F-14.\n\n` +
    `Unfortunately Goose ${man} is unconcious and lost at sea!. Click a box\n` +
    `to move the rescue ${ship} ship through the dangerous waters. A sonar\n` +
    `will tell you if you moving closer or farther from the crash zone.\n\n` +
    `When you are close, Maverick will point the exact coordinates.\n` +
    `Move the ship to the same square to rescue him!`
);

window.alert(
    `Rescue ${ring}Goose!\n\n` +
    `Note: You can only move one square at a time, and you can't enter rough` +
    `water ${wave} or rocks ${island}. Steer around them.\n\n`
);

// Get sailor's nae
while ((sailorName === null) || sailorName.length <= 0) {
    sailorName = prompt("What's the missing pilot's name?", "Lieutenant `Goose` Nick Bradshaw");

    if ((sailorName === null) || sailorName.length <= 0)
        window.alert("Sailor's name can't be blank!");
}

// Start the game
window.requestAnimationFrame(gameLoop);

console.log(`goodbye world from alab316.2.1`);
