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
		[ "#fce94f", "#edd400", "#c4a000"],
		[ "#8ae234", "#73d216", "#4e9a06"],
		[ "#e9b96e", "#c17d11", "#8f5902"],
		[ "#fcaf3e", "#f57900", "#ce5c00"],
		[ "#ad7fa8", "#75507b", "#5c3566"],
		[ "#ef2929", "#cc0000", "#a40000"],
		[ "#729fcf", "#3465a4", "#204a87"]
	],


	colors_rgb : [
		['rgba(252,233, 79,', 'rgba(237,212,  0,', 'rgba(196,160,  0,' ],
		['rgba(138,226, 52,', 'rgba(115,210, 22,', 'rgba( 78,154,  6,' ],
		['rgba(233,185,110,', 'rgba(193,125, 17,', 'rgba(143, 89,  2,' ],
		['rgba(252,175, 62,', 'rgba(245,121,  0,', 'rgba(206, 92,  0,' ],
		['rgba(173,127,168,', 'rgba(117, 80,123,', 'rgba( 92, 53,102,' ],
		['rgba(239, 41, 41,', 'rgba(204,  0,  0,', 'rgba(164,  0,  0,' ],
		['rgba(114,159,207,', 'rgba( 52,101,164,', 'rgba( 32, 74,135,' ]
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

		//alert('Here');

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
		elem = $("<div id='tetris_popup'>").appendTo('body');
		$("<div id='tetris_container>'").appendTo('#tetris_popup');
		
		$("<div class='tetris_background'>").appendTo('#tetris_container');
		$("<div class='tetris_game_background'>").appendTo('#tetris_container');
		$("<div class='preview_background'>").appendTo('#tetris_container');
		$("<div class='status_background'>").appendTo('#tetris_container');
		return elem;
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
	 * Initialize a tetris canvas with an embedded context.
	 * W and H are the block width and block height.
	 */
	init_canvas:function(w,h){
		
		// Set the context.
		this.ctx = this.getContext('2d');
		
		// Set the height and width parameters in the ctx.
		this.ctx.height = this.height;
		this.ctx.width = this.width;
		this.ctx.pix_height = this.height / h;
		this.ctx.pix_width = this.width / w;
		
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
	 * Shift columns down.
	 */
	shift_cols_down:function(row){

		for(y = row; y > 0; y--){

            // Flag to find empty rows (a halt condition)
            row_empty = true;

            for(x = 0; x < tetris.width; x++){
                if(tetris.matrix[x][y][0] > 0){
                    tetris.matrix[x][y][1] = [ clearEffect(endChain()) ];
                    row_empty = false;
                }

                tetris.matrix[x][y][0] = tetris.matrix[x][y-1][0];
                tetris.matrix[x][y][3] = tetris.matrix[x][y-1][3];

                if(tetris.matrix[x][y][0] > 0){
		            type = tetris.matrix[x][y][0];
				    tetris.matrix[x][y][1] = [ drawEffect(endChain()) ];
                }

            }

            if(row_empty){
                // We can safely halt the upwards scan, break.
                break; 
            }

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
				
				pixel = tetris.matrix[x][y][0];

				if(pixel == undefined || pixel == null || pixel <= 0){
					line_status = false;
				}
			}
			if(line_status){
				// Animate a row removal.
				blocks = [];
				for(x = 0; x < tetris.width; x++){
					tetris.matrix[x][y][1] = [
                        opEffect(1.0, 0.0, 10, endChain()),
						scaleEffect(1.0,1.0,0.5,0.5, 10, endChain())
					];
                    
				}

                // Increment the line count.
				line_count++;

                // Shift these columns down
                // TODO Adding the line count to the delay is a HACK. Fix this!
                delayExec(tetris.ctx, 10 + line_count, 'tetris.shift_cols_down(' + y + ');');

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
			if(tetris.matrix[point[0]][point[1]][0] > 0){
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
			tetris.matrix[point[0]][point[1]][0] = type;

			// Draw the current.
			// TODO: This may be redundant. Refactor!
			//tetris.render_block.call(tetris.ctx, type, point[0], point[1]);
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
			//tetris.draw_matrix();
			//tetris.update_matrix();

			// Set a new random piece on the board.
			tetris.set_piece();

			// Trigger Game Over if can_move returns false.
			if(!tetris.can_move(tetris.piece_stack[0][1])){
				tetris.game_over();
				return;
			} else {
				
				// Draw the current piece
				tetris.draw_piece();

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
		
		// TODO: Get rid of this!
		alert("Game Over, d00d!");

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
	 * Create a popup frame for Tetris.
	 */
	create_popup:function(){

		
		elem = tetris.create_tetris_popup();
		tetris.create_tetris_container().appendTo(elem);


	},


	/**
	 * Start the game! Only run this ONCE for each game!
	 * This should be usable as a new game method.
	 * TODO: Clean up.
	 */
	start:function(){


		// Create the html elements.
		tetris.create_popup();
		//tetris.create_tetris_container().appendTo('#tetris_container');

		// Set the canvasses and status section.
		//tetris.set_canvas(tetris.game_canvas_id);
		tetris.canvas = document.getElementById(tetris.game_canvas_id);
		tetris.init_canvas.call(tetris.canvas, tetris.width, tetris.height);
		tetris.ctx = tetris.canvas.ctx;
		
		
		//tetris.set_preview_canvas(tetris.preview_canvas_id);
		tetris.preview = document.getElementById(tetris.preview_canvas_id);
		tetris.init_canvas.call(tetris.preview, 6, 6);
		tetris.pre_ctx = tetris.preview.ctx;
		

		// Compute board parameters
		/*tetris.matrix = [tetris.height];

		// Initialize
		for(y = 0; y < tetris.height; y++){
			tetris.matrix[y] = new Array(tetris.width);
		}*/
        $(tetris.canvas).gridSetup(tetris.width,tetris.height,0);
        tetris.matrix = tetris.ctx.matrix;

		// Create a grid for the preview canvas
		$(tetris.preview).gridSetup(6,6,5);
		tetris.pre_matrix = tetris.pre_ctx.matrix;

		$(tetris.preview).blockShadows();
		//$(tetris.preview).effectsLoop();
	
		$(tetris.canvas).blockShadows();
        $(tetris.canvas).effectsLoop();

		// Set rendering default.
		$(tetris.canvas).setBlockFunc(tetris.l2_render_block);


		// Reset the piece queue.
		tetris.piece_stack = [];

		// Generate some pieces for the queue.
		tetris.set_piece();
		tetris.set_piece();


		// Initialize the status display
		tetris.create_status_display(tetris.status_display_id);

		// Initiate the user controls.		
		tetris.initiate_controls();

		// Clear interval if an interval is set.
		if(tetris.interval_id){
			clearInterval(tetris.interval_id);
			tetris.interval_id = null;
		}

		// Draw the preview piece
		tetris.render_preview();

		// Draw the initial piece.
		// TODO: Organize drawing more sanely to remove the necessity for this.
		tetris.draw_piece();

		// Initialize the iteration timer.
		tetris.interval_id = setInterval( function(){
			// Start iterating
			tetris.iterate();
		}, tetris.calculate_speed());

	},

	/**
	 * Toggle the pause state. (Also recalculates game speed, as a side
	 * effect).
	 */
	toggle_pause:function(){

		if(tetris.interval_id){
			// Halt the effects loop.
			$(tetris.canvas).haltEffectsLoop();

			clearInterval(tetris.interval_id);
			tetris.interval_id = null;
		} else {
			// Restart the effects loop.
			$(tetris.canvas).effectsLoop();

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

        //tetris.ctx.effects();
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
	 * Render a preview matrix.
	 *
	 * TODO: Size the preview piece and properly center.
	 */
	render_preview:function(){

		// Clear
		tetris.pre_ctx.clearRect(0,0,tetris.preview.width,tetris.preview.height);

		// Render the piece
		// Create the piece pattern.
		piece = tetris.create_piece(tetris.piece_stack[1][0]);
		pattern = piece[1];

		// TODO: Calculate center and draw scaled piece image!

		for(i = 0; i < 4; i++){
			type = piece[0];
			//tetris.pre_matrix[pattern[i][0] + 1][pattern[i][1] + 1][1] = [ drawEffect(tetris.colors[type][0], endChain()) ];
			tetris.pre_matrix[pattern[i][0] + 1][pattern[i][1] + 1][3] = type-1;
			tetris.pre_matrix[pattern[i][0] + 1][pattern[i][1] + 1][1] = [ drawEffect(endChain()) ];

		}

		// Trigger a drawing update.
		tetris.pre_ctx.effects();


	},

	/**
	 * Animation for clearing.
	 */
	// Fade and clear
	//clear_block_anim: [ opEffect( 0.7, 0.0, 7, endChain()) ],
	// Just clear
    clear_block_anim:[ clearEffect(endChain()) ],

	/**
	 * Animation for drawing.
	 */
	// Just draw
	draw_block_anim:[drawEffect(endChain()) ],
	// Fade In
	//draw_block_anim:[ opEffect( 0.0, 1.0, 5, endChain()) ],


	/**
	 * Draw the currenct piece on the game board.
	 */
	draw_piece:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?
		for(i = 0; i < 4; i++){
			tetris.matrix[piece[i][0]][piece[i][1]][3] = type-1; // TODO: Find a way to organize this type setting stuff better.
			tetris.matrix[piece[i][0]][piece[i][1]][1] = copyEffect(tetris.draw_block_anim);
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
		for(i = 0; i < 4; i++){
			tetris.matrix[piece[i][0]][piece[i][1]][1] = copyEffect(tetris.clear_block_anim);
		}


	},


	// TODO: Organize the custom block rendering stuff somewhere else!

	/**
	 * Level 1: Render block prototype function.
	 */
	l1_render_block:function(ctx, x, y) {

		type = ctx.matrix[x][y][3];

		// shorthand for the radix coeffs
		hc1 = ctx.hcoeff_1;
		vc1 = ctx.vcoeff_1;

		x = ctx.block_dimensions[0] / 2 - 2;
		y = ctx.block_dimensions[1] / 2 - 2;

		xh1 = -1 * x;// * hc1;
		xh2 = x;// * hc1;
		yh1 = -1 * y;// * vc1;
		yh2 = y;// * vc1;


		ctx.shadowBlur = 0;

		// Outer
		ctx.fillStyle = tetris.colors[type][1];
		ctx.shadowColor = tetris.colors[type][0];

		ctx.beginPath();

		ctx.moveTo(xh2, y);
		ctx.quadraticCurveTo(x, y, x, yh2);
		ctx.lineTo(x, yh1);
		ctx.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		ctx.lineTo(xh1, -1 * y);
		ctx.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		ctx.lineTo(-1 * x, yh2);
		ctx.quadraticCurveTo(-1 * x, y, xh1, y);
		
		ctx.closePath();

		ctx.fill();

		// Outline
		ctx.strokeStyle = tetris.colors[type][0];
		ctx.stroke();

		// Inner
		ctx.fillStyle = tetris.colors[type][2];

		// Scale down
		ctx.scale(0.5,0.5);	

		ctx.beginPath();

		ctx.moveTo(xh2, y);
		ctx.quadraticCurveTo(x, y, x, yh2);
		ctx.lineTo(x, yh1);
		ctx.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		ctx.lineTo(xh1, -1 * y);
		ctx.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		ctx.lineTo(-1 * x, yh2);
		ctx.quadraticCurveTo(-1 * x, y, xh1, y);
		
		ctx.closePath();
		
		ctx.fill();
		
	},

	/**
	 * Level 2: Render block prototype function.
	 */
	l2_render_block:function(ctx, x, y) {

		type = ctx.matrix[x][y][3];

		// shorthand for the radix coeffs
		hc1 = ctx.hcoeff_1;
		vc1 = ctx.vcoeff_1;

		x = ctx.block_dimensions[0] / 2 - ctx.max_shadow;
		y = ctx.block_dimensions[1] / 2 - ctx.max_shadow;

		xh1 = -1 * x * hc1;
		xh2 = x * hc1;
		yh1 = -1 * y * vc1;
		yh2 = y * vc1;

		// Save
		//ctx.save();

		ctx.beginPath();

		// Outer
		ctx.fillStyle = tetris.colors[type][1];
		ctx.shadowColor = tetris.colors[type][0];


		ctx.moveTo(xh2, y);
		ctx.quadraticCurveTo(x, y, x, yh2);
		ctx.lineTo(x, yh1);
		ctx.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		ctx.lineTo(xh1, -1 * y);
		ctx.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		ctx.lineTo(-1 * x, yh2);
		ctx.quadraticCurveTo(-1 * x, y, xh1, y);

		ctx.closePath();

		ctx.fill();

		// Outline
		ctx.strokeStyle = tetris.colors[type][0];
		ctx.stroke();
	
		// Remove the blur	
		ctx.shadowBlur = 0;
		
		// Inner
		ctx.fillStyle = tetris.colors[type][2];

		// Scale down
		ctx.scale(0.5,0.5);	

		ctx.beginPath();

		ctx.moveTo(xh2, y);
		ctx.quadraticCurveTo(x, y, x, yh2);
		ctx.lineTo(x, yh1);
		ctx.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		ctx.lineTo(xh1, -1 * y);
		ctx.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		ctx.lineTo(-1 * x, yh2);
		ctx.quadraticCurveTo(-1 * x, y, xh1, y);
		
		ctx.closePath();
		
		ctx.fill();
		
	}


}
