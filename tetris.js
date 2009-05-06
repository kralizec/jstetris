// JSTETRIS

function Tetris() {

/** Pieces */
this.pieces = 
[
	[
		[ 1, 1 ],
		[ 1, 1 ]
	],
	
	[
		[ 2, 0 ],
		[ 2, 2 ],
		[ 2, 0 ]
	],

	[
		[ 3 ],
		[ 3 ],
		[ 3 ],
		[ 3 ]
	],

	[
		[ 4, 4 ],
		[ 4, 0 ],
		[ 4, 0 ]
	],

	[
		[ 5, 0 ],
		[ 5, 0 ],
		[ 5, 5 ]
	],

	[
		[ 6, 0 ],
		[ 6, 6 ],
		[ 0, 6 ]
	],

	[
		[ 0, 7 ],
		[ 7, 7 ],
		[ 7, 0 ]
	]

];

this.board =
[
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
];

this.tempBoard = 
[
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
];


/* Graphics variables */
this.canvas = null;
this.ctx = null;

this.canvasWidth = 400;
this.canvasHeight = 600;

this.pixelWidth = 50;
this.pixelHeight = 50;

this.width = 8;
this.height = 12;


/* Game variables */
this.lines = 0;
this.speed = 600;
this.score = 0;
this.gameType = 0;
this.pause = 0;

this.activePiece = [ [0, 0], [0, 0], [0, 0], [0, 0] ];
this.tempPiece = [ [0, 0], [0, 0], [0, 0], [0, 0] ];

this.intervalId = null;


/* Methods */
this.init = init;
this.drawBoard = drawBoard;
this.clearBoard = clearBoard;
this.pieceGenerator = pieceGenerator;
this.gameStart = gameStart;
this.gameStop = gameStop;
this.scanLines = scanLines;
this.iterate = iterate;
this.move = move;
this.rotate = rotate;
this.processInput = processInput;
this.isValid = isValid;
this.canMove = canMove;
this.gameOver = gameOver;
//this.togglePause = togglePause;

function init() {

	// Initialize the canvas
	this.canvas = document.getElementById("game");
	this.ctx = this.canvas.getContext('2d');

	this.activePiece = 	[ [0, 0], [0, 0], [0, 0], [0, 0] ];
	this.tempPiece =	[ [0, 0], [0, 0], [0, 0], [0, 0] ];

	this.board =
	[
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
	];

	this.tempBoard = 
	[
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
	];

	// Clear the board
	//this.clearBoard();

	this.pieceGenerator();

}

function drawBoard() {

	this.clearBoard();

	// Draw the board as it appears
	//var x = 0;
	//var y = 0;

	for (var x = 0; x < this.width; x++){

		for(var y = 0; y < this.height; y++){
			
			if(this.board[x][y] != 0){
				
				var temp = this.board[x][y];

				if(temp < 0){
					temp *= -1;
				}

				/*var val = this.board[x][y];

				if(val < 0){
					val *= -1;
				}*/
				
				var color = "black";

				switch(temp){
					case 1: color = "blue"; break;
					case 2: color = "brown"; break;
					case 3: color = "red"; break;
					case 4: color = "white"; break;
					case 5: color = "magenta"; break;
					case 6: color = "green"; break;
					case 7: color = "cyan"; break;
					
				};

				this.ctx.fillStyle = color;
				
				this.ctx.fillRect(x * this.pixelWidth, y * this.pixelHeight, this.pixelWidth, this.pixelHeight);

			}

		}


	}


}

function clearBoard() {

	//ctx.fillStyle = "rgb(255,250,250)";
	this.ctx.fillStyle = "rgb(0,0,0)";
	this.ctx.fillRect(0,0,this.canvasWidth,this.canvasHeight);

}

// Game

/* Iterates the game once */
function iterate() {

	this.move(0, 1);

	// Draw the next board iteration
	//this.clearBoard();
	this.drawBoard();

}


/*
 * Active Pieces are represented by negative values of equal magnitude.
 */
function pieceGenerator(){

	// Generate a random piece index
	var rand = Math.floor(Math.random() * 7)

	var piece = this.pieces[rand];

	// Piece cell counter
	var r = 0;

	for(var x = 0; x < piece.length; x++){
		
		for(var y = 0; y < piece[x].length; y++){

			if(this.board[2 + x][0 + y] != 0){
				// Game fucking over
				this.gameOver();
			}

			// Set the pixel on the board
			this.board[2 + x][0 + y] = -1 * piece[x][y];

			// Set the locations in the active piece array
			if(piece[x][y] != 0){			
				this.activePiece[r][0] = 2 + x;
				this.activePiece[r][1] = 0 + y;		
			
				r++;
			}
		}

	}	


}


function gameStart(tetris) {

	//this.intervalId = setInterval(this.iterate, this.speed);
	if(this.intervalId != null){
		this.intervalId = setInterval(function(){ tetris.iterate() }, this.speed);
	}
}


function gameStop() {

	clearInterval(this.intervalId);
	this.intervalId = null;

}


/*
 * Scans the board for completed lines.
 * TODO: Massive efficiency improvements necessary.
 * 
 */
function scanLines() {

	this.tempBoard = 
	[
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
	];


	var lines = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	// Scan up from bottom

	var linesExist = false;

	for(var x = 0; x < 12; x++){

		var lineMult = 1;

		for( var y = 0; y < 8; y++){
			lineMult *= this.board[y][x];
		}

		// If this is greater than 0, we have a line
		if(lineMult != 0){
			lines[x] = 1;
			linesExist = true;
		}

	}

	if(linesExist){
		var r = 11;
		//for(var x = 0; x < 12; x++){
		for(var x = 11; x >= 0; x--){

			// Eliminate Lines
			if(lines[x] != 1){
			
				// Copy row
				for(var y = 0; y < 8; y++){
					this.tempBoard[y][r] = this.board[y][x];
				}
			
				// Increment counter
				r--;

			}

		}
		
		this.board = this.tempBoard.slice();
	}

}


function move(valX, valY) {


	// Collision detection
	/*for(var r = 0; r < 4; r++){
		
		if(this.activePiece[r][0] <= 0){
			return;
		} else if(this.activePiece[r][0] >= 8 - 1){
			return;
		}

	}*/

	// Determine anchor status
	// Make this piece inactive, and create a new piece
	for(var x = 0; x < 4; x++){

		if(this.board[this.activePiece[x][0]][this.activePiece[x][1] + 1] > 0){
			for(var r = 0; r < 4; r++){
				this.board[this.activePiece[r][0]][this.activePiece[r][1]] *= -1;
			}
			this.scanLines();
			this.pieceGenerator();
			return;
		}
	}

	// Collision Detection
	for( var r = 0; r < 4; r++){


		// Y Value too low/high
		if((this.activePiece[r][1] + valY > 11 )){ //||(this.activePiece[r][1] + valY < 0 )){
			for(var r = 0; r < 4; r++){
				this.board[this.activePiece[r][0]][this.activePiece[r][1]] *= -1;
			}
			this.scanLines();
			this.pieceGenerator();
			return;
		}
		
		// X Value too low/high
		if((this.activePiece[r][0] + valX > 7 )||(this.activePiece[r][0] + valX < 0 )){
			return;
		}

		// Space conflict
		if(this.board[this.activePiece[r][0] + valX][this.activePiece[r][1] + valY] > 0){
			return;
		}

	}

	var pieceVal = this.board[this.activePiece[0][0]][this.activePiece[0][1]];


	for(var x = 0; x < 4; x++){

		this.board[this.activePiece[x][0]][this.activePiece[x][1]] = 0;
		

		this.activePiece[x][0] += valX;
		this.activePiece[x][1] += valY;
		//this.board[this.activePiece[x][0] + val][this.activePiece[x][1]] = temp;

	}

	/*if(this.isValid()){
		this.activePiece = this.tempPiece.slice();

	} else {
		return;
	}*/

	for(var r = 0; r < 4; r++){
		
		this.board[this.activePiece[r][0]][this.activePiece[r][1]] = pieceVal;

	}

}

/**
 * Rotates the tetris piece
 *
 *
 */
function rotate(){


	// Perform a matrix transform on the piece.
	//
	//     0 1 2 3 4
	//   ----------- 
	// 0 | 0 0 0 0 0
	// 1 | 0 0 1 0 0
	// 2 | 0 1 1 1 0 
	// 3 | 0 0 0 0 0 
	// 4 | 0 0 0 0 0
	//
	
	// Calculate rotation point

	// TODO: Use a value other than this
	var rPt = 2;
	
	var rX = this.activePiece[rPt][0];
	var rY = this.activePiece[rPt][1];

	// Remove old piece
	//for(var x

	var pieceVal = this.board[this.activePiece[0][0]][this.activePiece[0][1]];

	// Rotate 90deg
	for(var x = 0; x < 4; x++){

		var tX = this.activePiece[x][0];
		var tY = this.activePiece[x][1];

		var dX = tX - rX;
		var dY = tY - rY;

		this.board[tX][tY] = 0;
		
		// New
		tX = tX - (dX + dY);
		tY = tY + (dX - dY);


		//this.activePiece[x][0] = tX;
		//this.activePiece[x][1] = tY;
		this.tempPiece[x][0] = tX;
		this.tempPiece[x][1] = tY;		

	}


	// Collision Detection
	for( var r = 0; r < 4; r++){

		// X Value too low/high
		if((this.tempPiece[r][0] > 7 )||(this.tempPiece[r][0] < 0 )){
			return;
		}

		// Y Value too low/high
		if((this.tempPiece[r][1] > 11 )||(this.tempPiece[r][1] < 0 )){
			return;
		}

		// Space conflict
		if(this.board[this.tempPiece[r][0]][this.tempPiece[r][1]] > 0){
			return;
		}

	}

	this.activePiece = this.tempPiece.slice();

	/*if(this.isValid()){
		this.activePiece = this.tempPiece.slice();
	} else {
		return;
	}*/

	for(var r = 0; r < 4; r++){
		
		this.board[this.activePiece[r][0]][this.activePiece[r][1]] = pieceVal;

	}


}

function processInput(event) {

	// 37 left
	// 38 up
	// 39 right
	// 40 down

	//alert("Bleh");

	//var charCode = event.charCode;
	var charCode = event.keyCode;

	switch(charCode){

		case 37: this.move(-1, 0); break;
		case 38: this.rotate(); break;
		case 39: this.move(1, 0); break;
		case 40: this.move(0, 1); break;

	};

	//this.move(1);

}

/**
 * Checks to see if any collisions occur with tempPiece.
 *
 */
function canMove(){

	for(var x = 0; x < 4; x++){

		var tX = this.activePiece[x][0];
		var tY = this.activePiece[x][1];

		/*if(tX <= 0){
			return false;
		}*/

		/*if((tX < 0) || (tX > 7)){
			return false;
		}*/

		if(tY >= 11){
			return false;
		}

		if(this.board[tX][tY+1] > 0 ){
			return false;
		} 
	}
	

	return true;

}

function isValid(){

	for(var x = 0; x < 4; x++){

		var tX = this.tempPiece[x][0];
		var tY = this.tempPiece[x][1];

		if(tX < 0 || tX > 7){
			return false;
		}

		if(tY < 0 || tY > 11){
			return false;
		}

		if(this.board[tX][tY] > 0 ){
			return false;
		} 
	}
	

	return true;

}

function gameOver(){

	this.ctx.fillStyle = "red";
	this.ctx.fillRect(0,0,this.canvasWidth,this.canvasHeight);

	if(this.intervalId != null){
		clearInterval(this.intervalId);
		this.intervalId = null;
	}
}

function pauseGame(){

	if(this.intervalId != null){

		clearInterval(this.intervalId);
		this.intervalId = null;

	}

}

/*function togglePause(){

	if(this.intervalId == null){
		this.gameStart();
	} else {
		this.pauseGame();
	}


}*/

};

