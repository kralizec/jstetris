/*****************************************************************************
 * Soviet Block Game v0.0.2
 *   ... In Soviet Russia, Tetris plays YOU!
 *
 * http://kralizec.org/jstetris
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
 *   1: Cleanup of method structure and generated markup.
 *   2: More advanced scoring.
 *   3: Gameplay tweaks (level speeds, control response, etc).
 *   4: Game Over message.
 *   5: Menu and help options.
 *   6: Music. (Procedurally generated?)
 *   7: Interface for stats tracking backend.
 *   8: Changing level backgrounds (easy, css backgrounds are supported).
 *   9: Block and background theming (possibly user customizable).
 *  10: Performance tweaks.
 *  11: Create drawing methods that better utilize javascript's function context paradigm.
 *  12: Utilize new drawing methods to enable complex animations. (line/bloc/col/region or combination)
 *  13: Fix preview window rendering (do after steps 11-12).
 *  14: Create a JavaScript load-time inlining technique to avoid repetive call overhead.
 *
 *****************************************************************************/

var tetris = {

	/*********************************************************************
	 * Variables and Constants
	 *********************************************************************/

	/* Rendering var defaults */
	game_canvas_id:'game_canvas',
	preview_canvas_id:'preview_canvas',
	status_display_id:'status_display',

	/* Active tetromino stack */
	piece_stack:[],

	/* Statistics Vars */
	score_display: null,
	level_display: null,
	lines_display: null,
	score: 0,
	lines: 0,
	level: 1,

	/* Game Constants */
	width:10,
	height:18,
	min_speed : 80,   // 80ms
	base_speed : 700, // 700ms
	level_step : 10,  // Increase level every 10 lines.

	/* This is the speed at which movement events cycle when keys are held down */
	move_speed : 50, // 50ms
	
	/* This is the period of time after which depressed keys cause repetitious action */
	repeat_wait : 75, // 75ms


	// A Tango color palette for drawing blocks.
	// Adding a null first element in case board spaces are set to 0. (get rid of this).
	colors : [
		[ null ],
		[ "#fce94f", "#edd400", "#c4a000"],
		[ "#8ae234", "#73d216", "#4e9a06"],
		[ "#e9b96e", "#c17d11", "#8f5902"],
		[ "#fcaf3e", "#f57900", "#ce5c00"],
		[ "#ad7fa8", "#75507b", "#5c3566"],
		[ "#ef2929", "#cc0000", "#a40000"],
		[ "#729fcf", "#3465a4", "#204a87"]
	],

	colors_rgb : [
		[ null ],
		['rgba(252,233,79,', 'rgba(237,212,0,', 'rgba(196,160,0,' ],
		['rgba(138,226,52,', 'rgba(115,210,22,', 'rgba(78,154,6,' ],
		['rgba(233,185,110,', 'rgba(193,125,17,', 'rgba(143,89,2,' ],
		['rgba(252,175,62,', 'rgba(245,121,0,', 'rgba(206,92,0,' ],
		['rgba(173,127,168,', 'rgba(117,80,123,', 'rgba(92,53,102,' ],
		['rgba(239,41,41,', 'rgba(204,0,0,', 'rgba(164,0,0,' ],
		['rgba(114,159,207,', 'rgba(52,101,164,', 'rgba(32,74,135,' ]
	],


	/*********************************************************************
	 * jQuery helper methods.
	 *********************************************************************/


	/**
	 * Build a default tetris game container.
	 * TODO: Refactor, cleanup, etc.
	 */
	create_tetris_container:function(){
		
		tetris_elem = $("<div id='tetris'>");
		tetris_elem.append($("<canvas id='game_canvas' height='540px' width='300px'></canvas>"));

		tetris_right = $("<div id='right_pane'>");
		tetris_elem.append(tetris_right);
		tetris_right.append($("<canvas id='preview_canvas' height='100px' width='100px'></canvas>"));
		tetris_right.append($("<div id='status_display'>"));

		// Create a text box and focus it to prevent vertical arrow key scrolling.
		hidden_box = $("<input type='text' id='tetris_hiddenbox'/>")
		tetris_right.append(hidden_box);
		hidden_box.hide();
		hidden_box.focus();


		return tetris_elem;
		
	},


	/**
	 * Build a popup container.
	 * Create absolutely positioned divs for use as display backgrounds.
	 * This technique lets us create transparent backgrounds with opaque
	 * foregrounds, without the need for transparent images.
	 * TODO: Refactor, cleanup, etc.
	 */
	create_tetris_popup:function(){
		$("<div id='tetris_popup'>").appendTo('body');
		$("<div id='tetris_container>'").appendTo('#tetris_popup');
		
		$("<div class='tetris_background'>").appendTo('#tetris_container');
		$("<div class='tetris_game_background'>").appendTo('#tetris_container');
		$("<div class='preview_background'>").appendTo('#tetris_container');
		$("<div class='status_background'>").appendTo('#tetris_container');
	},


	/*********************************************************************
	 * Initialization Logic (Needs work)
	 *********************************************************************/

	/**
	 * Creates the status display.
	 * TODO: Make this a little saner.
	 */
	create_status_display:function(display_id){

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
		tetris.score_display = score_row.insertCell(-1);
		tetris.lines_display = lines_row.insertCell(-1);
		tetris.level_display = level_row.insertCell(-1);

		// Set values
		tetris.score_display.innerHTML = tetris.score;
		tetris.lines_display.innerHTML = tetris.lines;
		tetris.level_display.innerHTML = tetris.level;

	},

	/**
	 * Associate a canvas element with this object.
	 */
	set_canvas:function(canvas_id) {

		tetris.canvas = document.getElementById(canvas_id);
		tetris.ctx = tetris.canvas.getContext('2d');
		
		// Assign height and width to the ctx object.
		tetris.ctx.height = tetris.canvas.height;
		tetris.ctx.width = tetris.canvas.width;
		tetris.ctx.pix_height = tetris.canvas.height / tetris.height;
		tetris.ctx.pix_width = tetris.canvas.width / tetris.width;
		
		// Pre-compute some rendering values.
		// TODO: Create the rendering scheme in one place!
		tetris.ctx.w_fact1 = tetris.ctx.pix_width * 0.25;
		tetris.ctx.h_fact1 = tetris.ctx.pix_height * 0.25;
		tetris.ctx.w_fact2 = tetris.ctx.pix_width * 0.5;	
		tetris.ctx.h_fact2 = tetris.ctx.pix_height * 0.5;
		

		tetris.canvas_height = tetris.canvas.height;
		tetris.canvas_width = tetris.canvas.width;

		tetris.pixel_height = tetris.canvas_height / tetris.height;
		tetris.pixel_width = tetris.canvas_width / tetris.width;

	},

	/**
	 * Associate a preview canvas
	 */
	set_preview_canvas:function(canvas_id){

		tetris.preview = document.getElementById(canvas_id);
		tetris.pre_ctx = tetris.preview.getContext('2d');

		// Assign height and width to the ctx object.
		tetris.pre_ctx.height = tetris.preview.height;
		tetris.pre_ctx.width = tetris.preview.width;
		tetris.pre_ctx.pix_height = tetris.preview.height / 6;
		tetris.pre_ctx.pix_width = tetris.preview.width / 6;
		
		// Pre-compute some rendering values.
		// TODO: Create the rendering scheme in one place!
		tetris.pre_ctx.w_fact1 = tetris.pre_ctx.pix_width * 0.25;
		tetris.pre_ctx.h_fact1 = tetris.pre_ctx.pix_height * 0.25;
		tetris.pre_ctx.w_fact2 = tetris.pre_ctx.pix_width * 0.5;	
		tetris.pre_ctx.h_fact2 = tetris.pre_ctx.pix_height * 0.5;


		tetris.preview_height = tetris.preview.height;
		tetris.preview_width = tetris.preview.width;

		tetris.pre_pixel_height = tetris.preview_height / 6;
		tetris.pre_pixel_width = tetris.preview_width / 6;

	},


	/*********************************************************************
	 * Game Logic
	 *********************************************************************/

	/**
	 * Calculates the current game speed.
	 */
	calculate_speed:function(){

		// TODO: Is the the appropriate speed determination?
		// speed = (MIN + BASE / LEVEL)
		return tetris.min_speed + tetris.base_speed / tetris.level

	},

	/* Creates a tetris piece.
	 *
	 * Format:
	 *    [ TYPE, [ [P1],[P2],... ] ]
	 *
	 */
	create_piece:function(type){
		
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

	},

	/**
	 * Place a piece on the matrix.
	 * TODO: Cleanup
	 */
	set_piece:function(){

		// Create a random piece.
		// FIXME: Using Math.round/floor/etc and others will result in
		// a NON random distribution. This is bad, as we want our
		// tetrominos to be truly (or at least almost) generated at
		// random!
		rand_type = Math.floor(Math.random() * (7 - 1 + 1)) + 1;
		piece_obj = tetris.create_piece(rand_type);
		//piece_obj = tetris.create_piece(Math.floor(Math.random()*7) + 1);
		
		//tetris.piece_stack.unshift(piece_obj);
		tetris.piece_stack.push(piece_obj);

		type = piece_obj[0];
		piece = piece_obj[1];


		// Adjust the piece position. (using start coordinates)
		// TODO: Start coordinates?
		startx = tetris.width / 2;
		starty = 0;

		for( x = 0; x < piece.length; x++ ){
			piece[x][0] += startx;
			piece[x][1] += starty;
		}


	},


	/**
	 * Scan for and remove completed lines from the matrix.
	 * TODO: Bring some sanity to tetris.
	 */
	scan_lines:function(){

		// Counter for total number of lines removed this pass. This is
		// related to Tetris scoring.
		line_count = 0;

		// Actually remove the lines.
		for(y = 0; y < tetris.height; y++){
			line_status = true;
			for(x = 0; x < tetris.width; x++){
				
				pixel = tetris.matrix[y][x];

				if(pixel == null || pixel <= 0){
					line_status = false;
				}
			}
			if(line_status){
				tetris.remove_line(y);
				line_count++;
			}
		}

		// Process score and line updates
		// TODO: Advanced scoring for multiple lines.
		if(line_count > 0){
			// Process score and linecount.
			tetris.score += (line_count * 10);
			tetris.lines += line_count;

			// Process level, and increase if necessary.
			val = tetris.lines / ( tetris.level * tetris.level_step);
			if(val >= 1){
				tetris.level++;
				// Increase the speed (by restarting interval).
				tetris.recalc_speed();
			}

			// Return true, indicating updates occurred.
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Detect whether or not the given piece is a valid move. Returns false
	 * if invalid, otherwise true.
	 * TODO: Cleanup
	 */
	can_move:function(piece){

		valid = true;

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			
			// Ensure that the points are on the board.
			if((point[0] >= tetris.width) || (point[0] < 0)){
				valid = false;
				break;
			}
			else if((point[1] >= tetris.height) || (point[1] < 0)){
				valid = false;
				break;
			}

			// Set valid equal to false if the space is occupied.
			if(tetris.matrix[point[1]][point[0]] > 0){
				valid = false;
				break;
			}

		}

		return valid;

	},


	/**
	 * Anchor the current piece to the board.
	 */
	anchor_current:function(){

		// Anchor the current piece to the board.
		for(x = 0; x < tetris.piece_stack[0][1].length; x++){
			point = tetris.piece_stack[0][1][x];
			tetris.matrix[point[1]][point[0]] = type;
		}

	},

	/**
	 * Removes a line, causing the rest of the lines to fall downwards.
	 * TODO: Multi-line removal detection will be required for proper scoring.
	 */
	remove_line:function(index){

		// Remove the old line.
		tetris.matrix.splice(index, 1);
		
		// Push a new line.
		tetris.matrix.unshift(new Array(tetris.width));

	},

	/**
	 * Execute a game iteration.
	 */
	iterate:function(){

		// Move down, and perform anchoring operations if move_down
		// returns false (indicating anchoring conditions).
		if(!tetris.move_down()){

			// Anchor the current piece.
			tetris.anchor_current();

			// Shift the old piece off the stack.
			tetris.piece_stack.shift();

			// Scan for lines.
			tetris.scan_lines();
			
			// Update the status display.
			tetris.update_status();

			// Draw the new matrix
			tetris.draw_matrix();

			// Set a new random piece on the board.
			tetris.set_piece();

			// Trigger Game Over if can_move returns false.
			if(!tetris.can_move(tetris.piece_stack[0][1])){
				tetris.game_over();
				return;
			} else {
				
				// Render a new piece preview.
				tetris.render_preview();
			}

		}

	},

	/**
	 * GAME OVER, d00d.
	 * TODO: Display some kind of insulting message.
	 */
	game_over:function(){

		//Log.log('GAME_OVER');

		// Clear the game iteration timer interval.
		clearInterval(tetris.interval_id);

		// Reset the initialization state.		
		// TODO
		//tetris.reset();
		
		// Clear the game canvas.
		tetris.clear_canvas();

	},




	/*********************************************************************
	 * Game Control Logic
	 *********************************************************************/


	/**
	 * Initiate keyboard controls.
	 *   The goal here is to get a good feel on all non-IE browsers.
	 *   TODO: Performance, feel, code cleanup.
	 */
	initiate_controls:function(){


		left = 'tetris.move_horiz(-1)';
		right = 'tetris.move_horiz(1)';
		down = 'tetris.move_down()';
		rotate = 'tetris.rotate()';

		document.onkeydown = function(e){

			//Log.log('key pressed!' + e.keyCode);

			// Don't allow simultaneous movements.
			if(tetris.l_int){ clearInterval(tetris.l_int); tetris.l_int = null; }
			if(tetris.r_int){ clearInterval(tetris.r_int); tetris.r_int = null; }
			if(tetris.d_int){ clearInterval(tetris.d_int); tetris.d_int = null; }
			if(tetris.rot_int){ clearInterval(tetris.rot_int); tetris.rot_int = null; }

			switch(e.keyCode){
				case 37:
				eval(left);
				tetris.l_int = setTimeout('tetris.l_int = tetris.continuous_movement(left)', tetris.repeat_wait );
				break;
				case 38:
				eval(rotate);
				//tetris.rot_int = setTimeout('tetris.rot_int = tetris.continuous_movement(rotate)', tetris.repeat_wait );
				break;
				case 39:
				eval(right);
				tetris.r_int = setTimeout('tetris.r_int = tetris.continuous_movement(right)', tetris.repeat_wait );
				break;
				case 40:
				eval(down);
				tetris.d_int = setTimeout('tetris.d_int = tetris.continuous_movement(down)', tetris.repeat_wait );
				break;
				case 80: tetris.toggle_pause(); break;	
			};


		};

		document.onkeyup = function(e){
			//Log.log('key up: ' + e.keyCode);
			switch(e.keyCode){
				case 37: clearInterval(tetris.l_int); tetris.l_int = null; break;
				case 38: clearInterval(tetris.rot_int); tetris.rot_int = null; break;
				case 39: clearInterval(tetris.r_int); tetris.r_int = null; break;
				case 40: clearInterval(tetris.d_int); tetris.d_int = null; break;
			};

		};

	},

	/**
	 * Continuous movement.
	 * Sets a movement interval.
	 */
	continuous_movement:function(func){

		// Eval the expression once.
		//eval(func);

		return setInterval(func, tetris.move_speed);

	},


	/**
	 * Trigger horizontal movement. Use negative numbers to move left.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 */
	move_horiz:function(amount){


		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0] + amount, point[1]];
		}
		
		if(tetris.can_move(temp_piece)){
			tetris.redraw_current_piece(temp_piece);
		}		

	},

	/**
	 * Trigger downward movement. Returns false if anchoring conditions are
	 * encountered.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 */
	move_down:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		temp_piece = [];

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			temp_piece[x] = [ point[0], point[1] + 1];
		}

		if(tetris.can_move(temp_piece)){
			tetris.redraw_current_piece(temp_piece);
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Perform a piece matrix rotation.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 * TODO: Cleanup.
	 */
	rotate:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

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
			case 3: if(tetris.even) { shift_y = -1; tetris.even = false; } else { tetris.even = true; } break;
			case 4: fix_x = 0.25; fix_y = 0.25; break;
			case 5: fix_x = 0.25; fix_y = 0.25; break;
			case 6: if(tetris.even) { shift_y = -1; tetris.even = false; } else { tetris.even = true; } break;
			case 7: if(tetris.even) { shift_y = -1; tetris.even = false; } else { tetris.even = true; } break;
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
		if( tetris.can_move(new_piece) ){
			tetris.redraw_current_piece(new_piece);
		}

	},

	/**
	 * Start the game! Only run this ONCE for each game!
	 * This should be usable as a new game method.
	 * TODO: Clean up.
	 */
	start:function(){

		// Compute board parameters
		tetris.matrix = [tetris.height];

		// Initialize
		for(y = 0; y < tetris.height; y++){
			tetris.matrix[y] = new Array(tetris.width);
		}

		// Reset the piece queue.
		tetris.piece_stack = [];

		// Generate some pieces for the queue.
		tetris.set_piece();
		tetris.set_piece();

		// Create the html elements.
		tetris.create_tetris_popup();
		tetris.create_tetris_container().appendTo('#tetris_container');

		

		// Set the canvasses and status section.
		tetris.set_canvas(tetris.game_canvas_id);
		tetris.set_preview_canvas(tetris.preview_canvas_id);

		// Initialize the status display
		tetris.create_status_display(tetris.status_display_id);

		// Initiate the user controls.		
		tetris.initiate_controls();

		// Clear interval if an interval is set.
		if(tetris.interval_id){
			clearInterval(tetris.interval_id);
			tetris.interval_id = null;
		}

		// Initialize the iteration timer.
		tetris.interval_id = setInterval( function(){
			tetris.iterate();
		}, tetris.calculate_speed());

	},

	/**
	 * Toggle the pause state. (Also recalculates game speed, as a side
	 * effect).
	 */
	toggle_pause:function(){

		if(tetris.interval_id){
			clearInterval(tetris.interval_id);
			tetris.interval_id = null;
		} else {
			// Initialize the iteration timer.
			tetris.interval_id = setInterval( function(){
				tetris.iterate();
			}, tetris.calculate_speed());
		}

	},

	/**
	 * Recalculates and adjusts the game's speed. Useful for starting new
	 * levels.
	 */
	recalc_speed:function(){
		if(tetris.interval_id){
			clearInterval(tetris.interval_id);
			tetris.interval_id = setInterval( function(){
				tetris.iterate();
			}, tetris.calculate_speed());
		} else {
			tetris.interval_id = setInterval( function(){
				tetris.iterate();
			}, tetris.calculate_speed());
		}
	},


	/*********************************************************************
	 * Rendering Logic
	 *********************************************************************/

	/**
	 * Clears and redraws the current piece.
	 */
	redraw_current_piece:function(new_piece){

		tetris.clear_piece();
		tetris.piece_stack[0][1] = new_piece;
		tetris.draw_piece();

	},

	/**
	 * Update the game status display.
	 */
	update_status:function(){
		//Log.log('Updating status...');

		tetris.score_display.innerHTML = tetris.score;
		tetris.lines_display.innerHTML = tetris.lines;
		tetris.level_display.innerHTML = tetris.level;

	},

	/**
	 * Clear the game canvas. Resets to transparency.
	 */
	clear_canvas:function(){
		tetris.ctx.clearRect(0,0,tetris.canvas_width,tetris.canvas_height);
	},

	/**
	 * Render a preview matrix.
	 *
	 * TODO: Size the preview piece and properly center.
	 */
	render_preview:function(){
		
		//Log.log('Rendering preview FIXME');

		// Create preview matrix:
		preview_matrix = [6];
		for(r = 0; r < preview_matrix.size; x++){
			preview_matrix[r] = [0,0,0,0,0,0];
		}

		// Clear
		//tetris.pre_ctx.fillStyle = 'rgb(0,0,0)';
		tetris.pre_ctx.clearRect(0,0,tetris.preview_width,tetris.preview_height);

		// Render the piece
		// Create the piece pattern.
		piece = tetris.create_piece(tetris.piece_stack[1][0]);
		pattern = piece[1];

		// TODO: Calculate center and draw scaled piece image!

		for(i = 0; i < 4; i++){
			tetris.render_block.call(tetris.pre_ctx, piece[0], pattern[i][0] + 1,pattern[i][1] + 1);
		}


	},


	/**
	 * Draw the game matrix.
	 * TODO: Performance! We can speed this up with an update_matrix method
	 * that does not redraw the whole board.
	 */
	draw_matrix:function(){

		//Log.log('Drawing the matrix...');

		// Clear first.
		tetris.clear_canvas();

		// Current row/col
		row = 0;
		col = 0;

		// Render the matrix.
		for(r = 0; r < tetris.height; r++){
			for(c = 0; c < tetris.width; c++){

				pixel = tetris.matrix[r][c];

				// TODO: Get rid of the need for this conditional, if possible.
				if(pixel >= 1){
	
					tetris.render_block.call(tetris.ctx, pixel, c, r);
					
				}

			}

		}

	},




	/**
	 * Draw the currenct piece on the game board.
	 */
	draw_piece:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?
		//colors = tetris.get_colors(type);

		for(i = 0; i < 4; i++){

			tetris.render_block.call(tetris.ctx, type, piece[i][0], piece[i][1]);

		}

	},

	/**
	 * Clear the current piece (clears to transparency).
	 */
	clear_piece:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?

		x1 = piece[0][0];
		x2 = piece[1][0];
		x3 = piece[2][0];
		x4 = piece[3][0];

		y1 = piece[0][1];
		y2 = piece[1][1];
		y3 = piece[2][1];
		y4 = piece[3][1];

		// Do the fading animation
		//tetris.block_fade(tetris.ctx, [type,x1,y1,null,1.0,20]);
		//tetris.block_fade(tetris.ctx, [type,x2,y2,null,1.0,20]);
		//tetris.block_fade(tetris.ctx, [type,x3,y3,null,1.0,20]);
		//tetris.block_fade(tetris.ctx, [type,x4,y4,null,1.0,20]);
		
		tetris.ctx.clearRect(piece[0][0] * tetris.pixel_width, piece[0][1] * tetris.pixel_height, tetris.pixel_width, tetris.pixel_height);
		tetris.ctx.clearRect(piece[1][0] * tetris.pixel_width, piece[1][1] * tetris.pixel_height, tetris.pixel_width, tetris.pixel_height);
		tetris.ctx.clearRect(piece[2][0] * tetris.pixel_width, piece[2][1] * tetris.pixel_height, tetris.pixel_width, tetris.pixel_height);
		tetris.ctx.clearRect(piece[3][0] * tetris.pixel_width, piece[3][1] * tetris.pixel_height, tetris.pixel_width, tetris.pixel_height);
	},


	/**
	 * Render a game block.
	 * Using a specified canvas context, this function will render a block.
	 */
	render_block:function(type, x, y){

		x = x * this.pix_width;
		y = y * this.pix_height;

		i_x = x + this.w_fact1;
		i_y = y + this.h_fact1;


		// TODO
		this.fillStyle = tetris.colors[type][1];
		this.fillRect(x,y,this.pix_width,this.pix_height);

		this.fillStyle = tetris.colors[type][0];
		this.fillRect(x+1,y+1,this.pix_height-2,this.pix_height-2);
				
		this.fillStyle = tetris.colors[type][2];
		this.fillRect(i_x,i_y,this.w_fact2,this.h_fact2);


	},

	/**
	 * Render a game block with adjustable opacity.
	 * Using a specified canvas context, this function will render a block.
	 */
	render_block_alpha:function(type, alpha, x, y){

		x = x * this.pix_width;
		y = y * this.pix_height;

		i_x = x + this.w_fact1;
		i_y = y + this.h_fact1;


		// TODO
		this.fillStyle = tetris.colors_rgb[type][1] + alpha + ')';
		this.fillRect(x,y,this.pix_width,this.pix_height);

		this.fillStyle = tetris.colors_rgb[type][0] + alpha + ')';
		this.fillRect(x+1,y+1,this.pix_height-2,this.pix_height-2);
				
		this.fillStyle = tetris.colors_rgb[type][2] + alpha + ')';
		this.fillRect(i_x,i_y,this.w_fact2,this.h_fact2);


	},

	/**
	 * Gradually fade a block away.
	 * TODO: Performance! Code refactoring for sanity.
	 */
	block_fade:function(ctx,piece){

		piece[3] = setInterval(function(){
			
					
			// Return if this cell is occupied.
			if(tetris.matrix[piece[1]][piece[2]] != undefined){
				clearInterval(piece[3]);
				tetris.render_block.call(ctx, piece[0], piece[1], piece[2]);
				return;
			}
			
			// Return if the active piece is occupying this space.
			// TODO: Find a better way!
			for(z = 0; z < 4; z++){
				ax = tetris.piece_stack[0][1][z][0];
				ay = tetris.piece_stack[0][1][z][1];

				if(piece[1] == ax && piece[2] == ay){
					clearInterval(piece[3]);
					tetris.render_block.call(ctx, piece[0], piece[1], piece[2]);
					return;
				}

			}

			x = piece[1] * ctx.pix_width;
			y = piece[2] * ctx.pix_height;
			
			// Save the context
			ctx.save();

			// Clear old.
			ctx.clearRect(x,y,ctx.pix_width,ctx.pix_height);

			if(piece[5] <= 0){ clearInterval(piece[3]); ctx.restore(); return; }
	
			// Draw current
			tetris.render_block_alpha.call(ctx, piece[0], piece[4], piece[1], piece[2]);

			// Delta
			piece[4] -= 0.05;
			piece[5]--;

			ctx.restore();

		}, 20);
	}

}
