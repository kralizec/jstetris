/*****************************************************************************
 * Soviet Block Game
 *   ... In Soviet Russia, Tetris plays YOU!
 *
 * Author: Jason Lawrence (2009)
 * Email: jason.lawrence@kralizec.org
 * License: You should all know about GPLv3 by now.
 *
 *****************************************************************************/
function GameMatrix(){

	/*********************************************************************
	 * Variables and Constants
	 *********************************************************************/


	/* self reference */
	self = this;
	
	/* Active tetromino stack */
	this.piece_stack = [];

	/* Statistics Vars */
	this.score_display = null;
	this.level_display = null;
	this.lines_display = null;
	this.score = 0;
	this.lines = 0;
	this.level = 1;
	
	/* Game Constants */
	this.min_speed = 80;   // 80ms
	this.base_speed = 700; // 700ms
	this.level_step = 10;  // Increase level every 10 lines.


	/* This is the speed at which movement events cycle when keys are held down */
	this.move_speed = 50; // 75ms
	
	/* This is the period of time after which depressed keys cause repetitious action */
	this.repeat_wait = 75; // 50ms


	/*********************************************************************
	 * Public Methods
	 *********************************************************************/


	/*********************************************************************
	 * Initialization Logic
	 *********************************************************************/

	/**
	 * Creates the status display.
	 * TODO: Make this a little saner.
	 */
	this.create_status_display = function(display_id){


		// Create the display table and append to the display container.
		display_table = document.createElement('table');
		display = document.getElementById(display_id);
		display.appendChild(display_table);

		// Description cells
		score_row = display_table.insertRow(-1);
		lines_row = display_table.insertRow(-1);
		level_row = display_table.insertRow(-1);

		// Create the row cells
		score_row.insertCell(-1).innerHTML = "Score:";
		lines_row.insertCell(-1).innerHTML = "Lines:";
		level_row.insertCell(-1).innerHTML = "Level:";

		// Initialize the value cells.
		self.score_display = score_row.insertCell(-1);
		self.lines_display = lines_row.insertCell(-1);
		self.level_display = level_row.insertCell(-1);

		// Set values
		self.score_display.innerHTML = this.score;
		self.lines_display.innerHTML = this.lines;
		self.level_display.innerHTML = this.level;

	}



	/*********************************************************************
	 * Game Logic
	 *********************************************************************/

	/**
	 * Calculates the current game speed.
	 */
	this.calculate_speed = function(){

		// TODO: Is the the appropriate speed determination?
		// speed = (MIN + BASE / LEVEL)
		return self.min_speed + self.base_speed / self.level

	}

	/* Creates a tetris piece.
	 *
	 * Format:
	 *    [ TYPE, COLOR, [ [P1],[P2],... ] ]
	 *
	 */
	this.create_piece = function(type){
		
		// Create the piece pattern.
		pattern = null;
		color = null;

		switch(type){
			case 1: color = 'blue';    pattern = [[0,0],[1,0],[0,1],[1,1]]; break;
			case 2: color = 'brown';   pattern = [[0,0],[0,1],[1,1],[0,2]]; break;
			case 3: color = 'red';     pattern = [[0,0],[0,1],[0,2],[0,3]]; break;
			case 4: color = 'white';   pattern = [[0,0],[1,0],[0,1],[0,2]]; break;
			case 5: color = 'magenta'; pattern = [[0,0],[0,1],[0,2],[1,2]]; break;
			case 6: color = 'green';   pattern = [[0,0],[0,1],[1,1],[1,2]]; break;
			case 7: color = 'cyan';    pattern = [[1,0],[0,1],[1,1],[0,2]]; break;
		};

		// Return an array containing the piece type and the pattern.
		return [ type, color, pattern ];

	}



	/*********************************************************************
	 * Game Control Logic
	 *********************************************************************/


	/**
	 * Initiate keyboard controls.
	 *   The goal here is to get a good feel on all non-IE browsers.
	 *   TODO: Performance, feel.
	 */
	this.initiate_controls = function(){


		left = 'self.move_horiz(-1)';
		right = 'self.move_horiz(1)';
		down = 'self.move_down()';
		rotate = 'self.rotate()';

		
		
		document.onkeydown = function(e){

			//Log.log('key pressed!' + e.keyCode);

			// Don't allow simultaneous movements.
			if(self.l_int){ clearInterval(self.l_int); self.l_int = null; }
			if(self.r_int){ clearInterval(self.r_int); self.r_int = null; }
			if(self.d_int){ clearInterval(self.d_int); self.d_int = null; }
			if(self.rot_int){ clearInterval(self.rot_int); self.rot_int = null; }

			switch(e.keyCode){
				case 37:
				eval(left);
				self.l_int = setTimeout('self.l_int = self.continuous_movement(left)', self.repeat_wait );
				break;
				case 38:
				eval(rotate);
				//self.rot_int = setTimeout('self.rot_int = self.continuous_movement(rotate)', self.repeat_wait );
				break;
				case 39:
				eval(right);
				self.r_int = setTimeout('self.r_int = self.continuous_movement(right)', self.repeat_wait );
				break;
				case 40:
				eval(down);
				self.d_int = setTimeout('self.d_int = self.continuous_movement(down)', self.repeat_wait );
				break;
				case 80: self.toggle_pause(); break;	
			};


		};

		document.onkeyup = function(e){
			//Log.log('key up: ' + e.keyCode);
			switch(e.keyCode){
				case 37: clearInterval(self.l_int); self.l_int = null; break;
				case 38: clearInterval(self.rot_int); self.rot_int = null; break;
				case 39: clearInterval(self.r_int); self.r_int = null; break;
				case 40: clearInterval(self.d_int); self.d_int = null; break;
			};

		};

	}

	/**
	 * Continuous movement.
	 * Sets a movement interval.
	 */
	this.continuous_movement = function(func){

		// Eval the expression once.
		//eval(func);

		return setInterval(func, self.move_speed);

	};


	this.move_horiz = function(amount){


		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][2];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0] + amount, point[1]];
		}
		
		if(this.can_move(temp_piece)){
			this.clear_piece();			
			self.piece_stack[0][2] = temp_piece;
			this.draw_piece();
		} else {
			//Log.log('Cannot Move!');	
		}		

	}

	this.move_down = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][2];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0], point[1] + 1];
		}

		if(this.can_move(temp_piece)){
			this.clear_piece();			
			self.piece_stack[0][2] = temp_piece;
			this.draw_piece();
		} else {
			//Log.log('Cannot Move down!');
			// Anchor the currenct piece to the board.
			for(x = 0; x < piece.length; x++){
				point = piece[x];
				this.matrix[point[1]][point[0]] = type;
			} 

			this.anchored = true;

		}
	}


	/* Start the game!
	 * Calling start again while running will act like a reset, and can be
	 * used to increase game speed.
	 */
	this.start = function(){

		// Clear interval if an interval is set.
		if(self.interval_id){
			clearInterval(self.interval_id);
			self.interval_id = null;
		}

		// Initialize the iteration timer.
		self.interval_id = setInterval( function(){
			self.iterate();
		}, self.calculate_speed());

	};

	/* Toggle the pause state.
	 */
	this.toggle_pause = function(){

		if(self.interval_id){
			clearInterval(self.interval_id);
			self.interval_id = null;
		} else {
			self.start();
		}

	}


	/*********************************************************************
	 * Rendering Logic
	 *********************************************************************/

	/**
	 * Update the game status display.
	 */
	this.update_status = function(){
		//Log.log('Updating status...');

		this.score_display.innerHTML = this.score;
		this.lines_display.innerHTML = this.lines;
		this.level_display.innerHTML = this.level;

	}

	/**
	 * Clear the game canvas.
	 */
	this.clear_canvas = function(){
		//Log.log('Clearing the canvas');
		//this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.clearRect(0,0,this.canvas_width,this.canvas_height);
	}

	/**
	 * Render a preview matrix.
	 *
	 * TODO: Size the preview piece and properly center.
	 */
	this.render_preview = function(){
		
		//Log.log('Rendering preview FIXME');

		// Create preview matrix:
		preview_matrix = [6];
		for(r = 0; r < preview_matrix.size; x++){
			preview_matrix[r] = [0,0,0,0,0,0];
		}

		// Clear
		this.pre_ctx.fillStyle = 'rgb(0,0,0)';
		this.pre_ctx.fillRect(0,0,this.preview_width,this.preview_height);

		// Render the piece
		// Create the piece pattern.
		piece = self.create_piece(self.piece_stack[1][0]);
		pattern = piece[2];

		// TODO: Calculate center and draw scaled piece image!

		this.pre_ctx.fillStyle = piece[1];

		// Draw points
		for(x = 0; x < pattern.length; x++){
			px = (pattern[x][0] + 1) * this.pre_pixel_width;
			py = (pattern[x][1] + 1) * this.pre_pixel_height;
			this.pre_ctx.fillRect(px, py, this.pre_pixel_width, this.pre_pixel_height);
		}


	}



	//////////////////////////////////////////////////////////////////////
	/*********************************************************************
	 * UNSORTED
	 *********************************************************************/
	//////////////////////////////////////////////////////////////////////

	/* Initialize the matrix. */
	this.init = function(width, height) {
	
		// Debug
		//Log.log('Creating game matrix');

		// Set class vars
		this.width = width;
		this.height = height;
		this.area = width * height;

		// Compute board parameters
		this.matrix = [width];

		// Initialize
		for(y = 0; y < height; y++){
			this.matrix[y] = new Array(width);
		}

		// Generate some pieces for the queue.
		self.set_piece();
		self.set_piece();
				

	};

	/* Associate a canvas element with this object.
	 */
	this.set_canvas = function(canvas_id) {

		this.canvas = document.getElementById(canvas_id);
		this.ctx = this.canvas.getContext('2d');

		this.canvas_height = this.canvas.height;
		this.canvas_width = this.canvas.width;

		this.pixel_height = this.canvas_height / this.height;
		this.pixel_width = this.canvas_width / this.width;

		// Clear the main canvas
		self.clear_canvas();

	}

	/* Associate a preview canvas
	 */
	this.set_preview_canvas = function(canvas_id){

		this.preview = document.getElementById(canvas_id);
		this.pre_ctx = this.preview.getContext('2d');

		this.preview_height = this.preview.height;
		this.preview_width = this.preview.width;

		this.pre_pixel_height = this.preview_height / 6;
		this.pre_pixel_width = this.preview_width / 6;

		// TODO: Render initial preview here?
		this.render_preview();
	};


	/**
	 * Draw the game matrix.
	 * TODO: Performance!
	 */
	this.draw_matrix = function(){

		//Log.log('Drawing the matrix...');

		// Clear first.
		self.clear_canvas();

		// Current row/col
		row = 0;
		col = 0;

		// Render the matrix.
		for(y = 0; y < this.height; y++){
			for(x = 0; x < this.width; x++){

				pixel = this.matrix[y][x];

				switch(pixel){
					case null: break;
					case 0: break;
					case 1: self.ctx.fillStyle = "blue"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 2: self.ctx.fillStyle = "brown"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 3: self.ctx.fillStyle = "red"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 4: self.ctx.fillStyle = "white"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 5: self.ctx.fillStyle = "magenta"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 6: self.ctx.fillStyle = "green"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
					case 7: self.ctx.fillStyle = "cyan"; this.ctx.fillRect(col * this.pixel_width, row * this.pixel_height, this.pixel_width, this.pixel_height); break;
				};

				// Increment the col
				col++;
			}

			// Increment the row, reset col.
			row++
			col = 0;

		}

	};


	/* Removes a line, causing the rest of the lines to fall downwards.
	 * TODO: Multi-line removal detection will be required for proper scoring.
	 */
	this.remove_line = remove_line;
	function remove_line(index){

		// Remove the old line.
		this.matrix.splice(index, 1);
		
		// Push a new line.
		this.matrix.unshift(new Array(this.width));

	};



	/* Place a piece on the matrix.
	 */
	this.set_piece = set_piece;
	function set_piece(){

		// DEBUG
		//Log.log('Creating a game piece!');

		// Create a random piece.
		// FIXME: Using Math.round/floor/etc and others will result in
		// a NON distribution. This is bad, as we want our tetrominos
		// to be truly (or at least almost) generated at random!
		rand_type = Math.floor(Math.random() * (7 - 1 + 1)) + 1;
		piece_obj = self.create_piece(rand_type);
		//piece_obj = self.create_piece(Math.floor(Math.random()*7) + 1);
		
		//self.piece_stack.unshift(piece_obj);
		self.piece_stack.push(piece_obj);

		type = piece_obj[0];
		piece = piece_obj[2];


		// Adjust the piece position. (using start coordinates)
		// TODO: Start coordinates?
		startx = this.width / 2;
		starty = 0;

		for( x = 0; x < piece.length; x++ ){
			piece[x][0] += startx;
			piece[x][1] += starty;
		}


	}

	/* Draw the currenct piece on the game board.
	 */
	this.draw_piece = draw_piece;
	function draw_piece(){

		type = self.piece_stack[0][0];
		color = self.piece_stack[0][1];
		piece = self.piece_stack[0][2];

		self.ctx.fillStyle = color;

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?		
		self.ctx.fillRect(piece[0][0] * this.pixel_width, piece[0][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.fillRect(piece[1][0] * this.pixel_width, piece[1][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.fillRect(piece[2][0] * this.pixel_width, piece[2][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.fillRect(piece[3][0] * this.pixel_width, piece[3][1] * this.pixel_height, this.pixel_width, this.pixel_height);

	}

	/* Clear the current piece (draw over with background color).
	 */
	this.clear_piece = clear_piece;
	function clear_piece(){

		type = self.piece_stack[0][0];
		//color = 'black';
		piece = self.piece_stack[0][2];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?		
		self.ctx.clearRect(piece[0][0] * this.pixel_width, piece[0][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[1][0] * this.pixel_width, piece[1][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[2][0] * this.pixel_width, piece[2][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[3][0] * this.pixel_width, piece[3][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		
	}

	/* Scan for and remove completed lines from the matrix.
	 */
	this.scan_lines = scan_lines;
	function scan_lines(){

		// Counter for total number of lines removed this pass. This is
		// related to Tetris scoring.
		line_count = 0;

		// Actually remove the lines.
		for(y = 0; y < this.height; y++){
			line_status = true;
			for(x = 0; x < this.width; x++){
				
				pixel = this.matrix[y][x];

				if(pixel == null || pixel <= 0){
					line_status = false;
				}
			}
			if(line_status){
				this.remove_line(y);
				line_count++;
			}
		}

		// Process score and line updates
		// TODO: Advanced scoring for multiple lines.
		if(line_count > 0){
			// Process score and linecount.
			self.score += (line_count * 10);
			self.lines += line_count;

			// Process level, and increase if necessary.
			val = self.lines / ( self.level * self.level_step);
			if(val >= 1){
				self.level++;
				// Increase the speed (by restarting interval).
				self.start();
			}

			// Return true, indicating updates occurred.
			return true;
		} else {
			return false;
		}
	};

	/* Sinks the piece. Returns true if successful, false if collision.
	 */
	this.move_down_old = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][2];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0], point[1] + 1];
		}

		if(this.can_move(temp_piece)){
			this.clear_piece();			
			self.piece_stack[0][2] = temp_piece;
			this.draw_piece();
		} else {
			//Log.log('Cannot Move down!');
			// Anchor the currenct piece to the board.
			for(x = 0; x < piece.length; x++){
				point = piece[x];
				this.matrix[point[1]][point[0]] = type;
			} 

			this.anchored = true;

		}


	};

	/* Move left or right. (-) for left.
	 */
	this.move_horiz_old = function(amount){
		
		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][2];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0] + amount, point[1]];
		}
		
		if(this.can_move(temp_piece)){
			this.clear_piece();			
			self.piece_stack[0][2] = temp_piece;
			this.draw_piece();
		} else {
			//Log.log('Cannot Move!');	
		}	

	}

	/* Detect anchoring conditions. Returns false if piece must be anchored.
	 */
	this.can_move = function(piece){

		valid = true;

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			
			// Ensure that the points are on the board.
			if((point[0] >= this.width) || (point[0] < 0)){
				valid = false;
				break;
			}
			else if((point[1] >= this.height) || (point[1] < 0)){
				valid = false;
				break;
			}

			// Set valid equal to false if the space is occupied.
			if(this.matrix[point[1]][point[0]] > 0){
				valid = false;
				break;
			}

		}

		return valid;

	};

	
	/* Iterate.
	 */
	this.iterate = iterate;
	function iterate(){

		// Create a new piece if this is the beginning, or if anchoring ocurred.
		// Also, scan for lines.
		if(this.anchored){
			// Remove the old piece.
			self.piece_stack.shift();

			// Fix for rotation climbing issues.
			self.r_height = null;

			// Scan for lines, and update status if there were any.
			if(self.scan_lines()){
				self.update_status();
			}

			// Redraw Matrix
			self.draw_matrix();

			this.set_piece();

			if(!this.can_move(self.piece_stack[0][2])){
				//Log.log('GAME_OVER');
				clearInterval(this.interval_id);
				this.init();
				this.clear_canvas();
				return;
			}

			// TODO: Render here?
			this.render_preview();

			this.anchored = false;
		}

		// Process user input. Rotation and Horizontal movement.
		// ...or move down.
		this.move_down();

	};



	/**
	 * Perform a piece matrix rotation.
	 */
	this.rotate = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][2];

		new_piece = [];

		// Calculate block center
		r_x = 0;
		r_y = 0;
		for( x = 0; x < 4; x++ ){
			r_x += piece[x][0];
			r_y += piece[x][1];
		}

		// Fix for spin climbing.
		fix_x = 0;
		fix_y = 0;
		shift_y = 0;

		no_round = false;
		switch(type){
			case 1: return; break;
			case 2: fix_x = 0.25; fix_y = 0.25; break; 
			case 3: if(self.even) { shift_y = -1; self.even = false; } else { self.even = true; } break;
			case 4: fix_x = 0.25; fix_y = 0.25; break;
			case 5: fix_x = 0.25; fix_y = 0.25; break;
			case 6: if(self.even) { shift_y = -1; self.even = false; } else { self.even = true; } break;
			case 7: if(self.even) { shift_y = -1; self.even = false; } else { self.even = true; } break;
		
		};


		r_x = Math.round((r_x/4) - fix_x);
		r_y = Math.round((r_y/4) - fix_y);
	

		// ... TRANSFORM!!!
		for( x = 0; x < 4; x++ ){

			x1 = piece[x][0];
			y1 = piece[x][1];
			
			t_x = y1 + r_x - r_y;
			t_y = r_x + r_y - x1;

			new_piece[x] = [t_x, t_y + shift_y];

		}

		// Calculate transform validity
		if( this.can_move(new_piece) ){
			this.clear_piece();
			self.piece_stack[0][2] = new_piece;
			this.draw_piece();
		} else {
			//Log.log("Cannot rotate!");
		}


	};


};

