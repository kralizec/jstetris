/*****************************************************************************
 * Soviet Block Game v0.0.1
 *   ... In Soviet Russia, Tetris plays YOU!
 *
 * Author: Jason Lawrence (2009)
 * Email: jason.lawrence@kralizec.org
 * License: You should all know about GPLv3 by now.
 *
 * Controls:
 *   Arrow Keys will move, and the up arrow rotates the piece. Holding a key
 *   down will trigger auto-movement after a brief timeout. Auto-rotation is
 *   disabled by default (this is also more consistent with the Tetris feel I
 *   am going for).
 *   'p' will pause the game, though this will likely change.
 *   More to come...
 *
 *
 * TODO List:
 *   1: Cleanup of method structure.
 *   2: More advanced scoring.
 *   3: Gameplay tweaks (level speeds, control response, etc).
 *   4: Game Over message.
 *   5: Menu and help options.
 *   6: Music. (Procedurally generated?)
 *   7: Interface for stats tracking backend.
 *   8: Changing level backgrounds (easy, css backgrounds are supported).
 *   9: Block and background theming (possibly user customizable).
 *  10: Performance tweaks.
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
	this.move_speed = 50; // 50ms
	
	/* This is the period of time after which depressed keys cause repetitious action */
	this.repeat_wait = 75; // 75ms


	// A Tango color palette for drawing blocks.
	// Adding a null first element in case board spaces are set to 0.
	this.colors = [
		[ null ],
		[ "#fce94f", "#edd400", "#c4a000"],
		[ "#8ae234", "#73d216", "#4e9a06"],
		[ "#e9b96e", "#c17d11", "#8f5902"],
		[ "#fcaf3e", "#f57900", "#ce5c00"],
		[ "#ad7fa8", "#75507b", "#5c3566"],
		[ "#ef2929", "#cc0000", "#a40000"],
		[ "#729fcf", "#3465a4", "#204a87"]
	];

	/*********************************************************************
	 * Initialization Logic (Needs work)
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

	/**
	 * Initialize the matrix.
	 * TODO: Improve init logic.
	 */
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

	/**
	 * Associate a canvas element with this object.
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

	/**
	 * Associate a preview canvas
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
	 *    [ TYPE, [ [P1],[P2],... ] ]
	 *
	 */
	this.create_piece = function(type){
		
		// Create the piece pattern.
		pattern = null;

		switch(type){
			case 1: pattern = [[0,0],[1,0],[0,1],[1,1]]; break;
			case 2: pattern = [[0,0],[0,1],[1,1],[0,2]]; break;
			case 3: pattern = [[0,0],[0,1],[0,2],[0,3]]; break;
			case 4: pattern = [[0,0],[1,0],[0,1],[0,2]]; break;
			case 5: pattern = [[0,0],[0,1],[0,2],[1,2]]; break;
			case 6: pattern = [[0,0],[0,1],[1,1],[1,2]]; break;
			case 7: pattern = [[1,0],[0,1],[1,1],[0,2]]; break;
		};

		// Return an array containing the piece type and the pattern.
		return [ type, pattern ];

	}

	/**
	 * Place a piece on the matrix.
	 * TODO: Cleanup
	 */
	this.set_piece = set_piece;
	function set_piece(){

		// Create a random piece.
		// FIXME: Using Math.round/floor/etc and others will result in
		// a NON random distribution. This is bad, as we want our
		// tetrominos to be truly (or at least almost) generated at
		// random!
		rand_type = Math.floor(Math.random() * (7 - 1 + 1)) + 1;
		piece_obj = self.create_piece(rand_type);
		//piece_obj = self.create_piece(Math.floor(Math.random()*7) + 1);
		
		//self.piece_stack.unshift(piece_obj);
		self.piece_stack.push(piece_obj);

		type = piece_obj[0];
		piece = piece_obj[1];


		// Adjust the piece position. (using start coordinates)
		// TODO: Start coordinates?
		startx = this.width / 2;
		starty = 0;

		for( x = 0; x < piece.length; x++ ){
			piece[x][0] += startx;
			piece[x][1] += starty;
		}


	}


	/**
	 * Scan for and remove completed lines from the matrix.
	 * TODO: Bring some sanity to this.
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

	/**
	 * Detect whether or not the given piece is a valid move. Returns false
	 * if invalid, otherwise true.
	 * TODO: Cleanup
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


	/**
	 * Anchor the current piece to the board.
	 */
	this.anchor_current = function(){

		// Anchor the current piece to the board.
		for(x = 0; x < self.piece_stack[0][1].length; x++){
			point = self.piece_stack[0][1][x];
			self.matrix[point[1]][point[0]] = type;
		}

	}

	/**
	 * Removes a line, causing the rest of the lines to fall downwards.
	 * TODO: Multi-line removal detection will be required for proper scoring.
	 */
	this.remove_line = function(index){

		// Remove the old line.
		this.matrix.splice(index, 1);
		
		// Push a new line.
		this.matrix.unshift(new Array(this.width));

	}

	/**
	 * Execute a game iteration.
	 */
	this.iterate = function(){

		// Move down, and perform anchoring operations if move_down
		// returns false (indicating anchoring conditions).
		if(!self.move_down()){

			// Anchor the current piece.
			self.anchor_current();

			// Shift the old piece off the stack.
			self.piece_stack.shift();

			// Scan for lines.
			self.scan_lines();
			
			// Update the status display.
			self.update_status();

			// Draw the new matrix
			self.draw_matrix();

			// Set a new random piece on the board.
			self.set_piece();

			// Trigger Game Over if can_move returns false.
			if(!self.can_move(self.piece_stack[0][1])){
				self.game_over();
				return;
			} else {
				
				// Render a new piece preview.
				self.render_preview();
			}

		}

	}

	/**
	 * GAME OVER, d00d.
	 * TODO: Display some kind of insulting message.
	 */
	this.game_over = function(){

		//Log.log('GAME_OVER');

		// Clear the game iteration timer interval.
		clearInterval(this.interval_id);

		// Reset the initialization state.		
		self.init();
		
		// Clear the game canvas.
		self.clear_canvas();

	}




	/*********************************************************************
	 * Game Control Logic
	 *********************************************************************/


	/**
	 * Initiate keyboard controls.
	 *   The goal here is to get a good feel on all non-IE browsers.
	 *   TODO: Performance, feel, code cleanup.
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


	/**
	 * Trigger horizontal movement. Use negative numbers to move left.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 */
	this.move_horiz = function(amount){


		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][1];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0] + amount, point[1]];
		}
		
		if(self.can_move(temp_piece)){
			self.redraw_current_piece(temp_piece);
		}		

	}

	/**
	 * Trigger downward movement. Returns false if anchoring conditions are
	 * encountered.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 */
	this.move_down = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][1];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0], point[1] + 1];
		}

		if(self.can_move(temp_piece)){
			self.redraw_current_piece(temp_piece);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Perform a piece matrix rotation.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 * TODO: Cleanup.
	 */
	this.rotate = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][1];

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

		// FIXME: Find a clever (mathematical) way out of this madness.
		// Elaborate (and annoying) fix for spin-climbing.
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

		// Calculate transform validity and redraw if ok.
		if( self.can_move(new_piece) ){
			self.redraw_current_piece(new_piece);
		}

	}

	/**
	 * Start the game!
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

	/**
	 * Toggle the pause state.
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
	 * Clears and redraws the current piece.
	 */
	this.redraw_current_piece = function(new_piece){

		self.clear_piece();
		self.piece_stack[0][1] = new_piece;
		self.draw_piece();

	}

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
	 * Clear the game canvas. Resets to transparency.
	 */
	this.clear_canvas = function(){
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
		pattern = piece[1];

		// TODO: Calculate center and draw scaled piece image!
		//colors =  self.get_colors(piece[0]);

		for(i = 0; i < 4; i++){
			x = (pattern[i][0] + 1) * this.pre_pixel_width;
			y = (pattern[i][1] + 1) * this.pre_pixel_height;
			w = this.pre_pixel_width;
			h = this.pre_pixel_height;

			i_x = x + (this.pre_pixel_width * 0.25);
			i_y = y + (this.pre_pixel_width * 0.25);
			i_w = this.pre_pixel_width * 0.5;	
			i_h = this.pre_pixel_width * 0.5;


			self.pre_ctx.fillStyle = self.colors[piece[0]][0];
			self.pre_ctx.fillRect(x,y,w,h);
				
			self.pre_ctx.fillStyle = self.colors[piece[0]][1];
			self.pre_ctx.strokeRect(x,y,w,h);

			self.pre_ctx.fillStyle = self.colors[piece[0]][2];
			self.pre_ctx.fillRect(i_x,i_y,i_w,i_h);

		}


	}

	/**
	 * Draw an individual block.
	 */
	this.draw_block = function(color, x, y, w, h){

				this.ctx.fillStyle = color;
				this.ctx.fillRect(x, y, w, h);

	}


	/**
	 * Draw the game matrix.
	 * TODO: Performance! We can speed this up with an update_matrix method
	 * that does not redraw the whole board.
	 */
	this.draw_matrix = function(){

		//Log.log('Drawing the matrix...');

		// Clear first.
		self.clear_canvas();

		// Current row/col
		row = 0;
		col = 0;

		// Render the matrix.
		for(r = 0; r < this.height; r++){
			for(c = 0; c < this.width; c++){

				pixel = this.matrix[r][c];

				// TODO: Get rid of the need for this conditional, if possible.
				if(pixel >= 1){
					x = c * this.pixel_width;
					y = r * this.pixel_height;
					w = this.pixel_width;
					h = this.pixel_height;

					i_x = x + (this.pixel_width * 0.25);
					i_y = y + (this.pixel_width * 0.25);
					i_w = this.pixel_width * 0.5;	
					i_h = this.pixel_width * 0.5;


					self.ctx.fillStyle = self.colors[pixel][0];
					self.ctx.fillRect(x,y,w,h);

					self.ctx.fillStyle = self.colors[pixel][1];
					self.ctx.strokeRect(x,y,w,h);

					self.ctx.fillStyle = self.colors[pixel][2];
					self.ctx.fillRect(i_x,i_y,i_w,i_h);
				}

			}

		}

	};




	/**
	 * Draw the currenct piece on the game board.
	 */
	this.draw_piece = function(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?
		//colors = self.get_colors(type);

		for(i = 0; i < 4; i++){

			// Precalculating these values, primarily for readability.
			x = piece[i][0] * this.pixel_width;
			y = piece[i][1] * this.pixel_height;
			w = this.pixel_width;
			h = this.pixel_height;

			i_x = x + (this.pixel_width * 0.25);
			i_y = y + (this.pixel_width * 0.25);
			i_w = this.pixel_width * 0.5;	
			i_h = this.pixel_width * 0.5;


			// Draw the colored blocks.
			self.ctx.fillStyle = self.colors[type][0];
			self.ctx.fillRect(x,y,w,h);
				
			self.ctx.fillStyle = self.colors[type][1];
			self.ctx.strokeRect(x,y,w,h);

			self.ctx.fillStyle = self.colors[type][2];
			self.ctx.fillRect(i_x,i_y,i_w,i_h);

		}

	}

	/**
	 * Clear the current piece (clears to transparency).
	 */
	this.clear_piece = clear_piece;
	function clear_piece(){

		type = self.piece_stack[0][0];
		piece = self.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?		
		self.ctx.clearRect(piece[0][0] * this.pixel_width, piece[0][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[1][0] * this.pixel_width, piece[1][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[2][0] * this.pixel_width, piece[2][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		self.ctx.clearRect(piece[3][0] * this.pixel_width, piece[3][1] * this.pixel_height, this.pixel_width, this.pixel_height);
		
	}


};

