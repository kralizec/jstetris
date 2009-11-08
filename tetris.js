/*****************************************************************************
 * Soviet Block Game v0.0.2
 *   ... In Soviet Russia, Tetris plays YOU!
 *
 * http://kralizec.org/jstetris
 * Author: Jason Lawrence (2009)
 * Email: jason.lawrence@kralizec.org
 * License: You should all know about GPLs3 by now.
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
	//width:10,
	//height:18,
	width:12,
	height:20,
	min_speed : 80,   // 80ms
	base_speed : 700, // 700ms
	level_step : 10,  // Increase level every 10 lines.

	/* This is the speed at which movement events cycle when keys are held down */
	move_speed : 50, // 50ms
	
	/* This is the period of time after which depressed keys cause repetitious action */
	repeat_wait : 75, // 75ms

		
	/*********************************************************************
	 * jQuery helper methods.
	 *********************************************************************/


	/**
	 * Build a default tetris game container.
	 * TODO: Refactor, cleanup, etc.
	 */
	create_tetris_container:function(){
		
		var tetris_elem = $("<div id='tetris'>");
		tetris_elem.append($("<canvas id='game_canvas' height='540px' width='300px'></canvas>"));

		var tetris_right = $("<div id='right_pane'>");
		tetris_elem.append(tetris_right);
		tetris_right.append($("<canvas id='preview_canvas' height='100px' width='100px'></canvas>"));
		tetris_right.append($("<div id='status_display'>"));

		// Create a text box and focus it to prevent vertical arrow key scrolling.
		var hidden_box = $("<input type='text' id='tetris_hiddenbox'/>")
		tetris_right.append(hidden_box);
		hidden_box.focus().hide();
		//hidden_box.focus();

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

	/**
	 * Creates a tetris piece.
	 *
	 * Format:
	 *    [ TYPE, [ [P1],[P2],... ] ]
	 *
	 */
	create_piece:function(type){
		
		// Create the piece pattern.
		var pattern = null;

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

            var rand_type;
            var piece_obj;
            var type;
            var piece;
            var startx;
            var starty;
            var x;

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
	 * TODO: Optimize and fix this mess.
	 */
	shift_cols_down:function(rows){

                var r;
                var y;
                var x;
                var row_empty;
                var type;

		// Start at the top and work down.
		// TODO: We may need a sort here at some point.
		//for(r = rows.length-1; r >= 0; r--){
		for(r = 0; r < rows.length; r++){ 
		//r = 0; // The lowest row

			for(y = rows[r]; y > 0; y--){

            			// Flag to find empty rows (a halt condition)
            			row_empty = true;

            			for(x = 0; x < tetris.width; x++){
					/*	
					if(tetris.ctx.getState(x,y) > 0){
	    			    		tetris.ctx.setAnim(x, y, [ clearEffect(endChain()) ]);
            			    		row_empty = false;
            			    	}

					tetris.ctx.setState(x,y, tetris.ctx.getState(x,y-1));
	    			    	tetris.ctx.setType(x,y, tetris.ctx.getType(x,y-1));
					
					switch(tetris.ctx.getState(x,y-1)){

					// Dead line
					case 0: break;

					// Normal Locked block
					case 1; row_empty = false; break;

					// Block in line to be removed.
					case 2; row_empty = false; break;



					};
					*/
	    			    if(tetris.ctx.getState(x,y) > 0){
					// FIXME: Extract these.
	    			    	tetris.ctx.setAnim(x, y, [ clearEffect(endChain()) ]);
            			    	row_empty = false;
            			    }

	    			    // TODO: Implement a pixel shifting system in enceladus.
	    			    tetris.ctx.setState(x,y, tetris.ctx.getState(x,y-1));
	    			    tetris.ctx.setType(x,y, tetris.ctx.getType(x,y-1));

	    			    if(tetris.ctx.getState(x,y) > 0){
	    			    	type = tetris.ctx.getState(x,y);
	    			    	tetris.ctx.setAnim(x, y, [ drawEffect(endChain()) ]);
            			    }


            			}

            			if(row_empty){
            			    // We can safely halt the upwards scan, break.
            			    break; 
            			}

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
		var line_count = 0;
		var lines = [];
                var y, x;
                var line_status = true;
                var pixel;
                var val;

		// Actually remove the lines.
		for(y = 0; y < tetris.height; y++){
			line_status = true;

			// TODO: We could use a reduce here.
			for(x = 0; x < tetris.width; x++){
				
				//pixel = tetris.matrix[x][y][0];
				pixel = tetris.ctx.getState(x,y);

				if(pixel == undefined || pixel == null || pixel <= 0){
					line_status = false;
				}
			}
			if(line_status){
					
				// Animate a row removal.
				for(x = 0; x < tetris.width; x++){
					// Set the state to 2, indicating a transitional phase.
					// Line removal will halt here.
					tetris.ctx.setState(x,y,2);

					// Animate out
					tetris.ctx.setAnim(x, y, tetris.line_anim());
					//tetris.ctx.setAnim(x, y, [
                        		//	opEffect(1.0, 0.0, 10, endChain()),
					//	scaleEffect(1.0,1.0,0.5,0.5, 10, endChain())
					//	]);
                    
				}

                		// Increment the line count.
				line_count++;

				// Add the line to the line removal array.
				lines.push(y);


			}
		}
		
		// Delay execution of the column shifting to allow for animations.
		// TODO: Make animations optionally independent from state.
		delayExec(tetris.ctx, 10, tetris.shift_func(lines));


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

				// Reset the level config.
				tetris.level_config();

				// Force a redraw on the whole board.
				tetris.draw_level_transition();

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
	 * Simple helper for scanlines.
	 * TODO: Remove the need for this.
	 */
	shift_func:function(lines){
		var rows = lines;
		return function(){
			// Shift columns
			tetris.shift_cols_down(rows);
		};
	},

	/**
	 * Detect whether or not the given piece is a valid move. Returns false
	 * if invalid, otherwise true.
	 * Takes h and v, which are horizontal and vertical modifiers.
	 * TODO: Cleanup and optimize
	 */
	can_move:function(piece,h,v){

		valid = true;

		for(x = 0; x < piece.length; x++){
			point = piece[x];
			
			// Ensure that the points are on the board.
			if((point[0]+h >= tetris.width) || (point[0]+h < 0)){
				valid = false;
				break;
			}
			else if((point[1]+v >= tetris.height) || (point[1]+v < 0)){
				valid = false;
				break;
			}

			// Set valid equal to false if the space is occupied.
			if(tetris.ctx.getState(point[0]+h,point[1]+v) > 0){
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
			tetris.ctx.setState(point[0], point[1], 1);
			tetris.ctx.setType(point[0], point[1], tetris.piece_stack[0][0]-1);
			
			// Add the anchoring animation.
			tetris.ctx.setAnim(point[0], point[1], tetris.anchor_anim());
		}

	},


	/**
	 * Execute a game iteration.
	 */
	iterate:function(){

		// Move down, and perform anchoring operations if move_down
		// returns false (indicating anchoring conditions).
		if(!tetris.move(0,1)){

			// Anchor the current piece.
			tetris.anchor_current();

			// Shift the old piece off the stack.
			tetris.piece_stack.shift();

			// Scan for lines.
			tetris.scan_lines();
			
			// Update the status display.
			tetris.update_status();

			// Set a new random piece on the board.
			tetris.set_piece();

			// Trigger Game Over if can_move returns false.
			if(tetris.can_move(tetris.piece_stack[0][1], 0, 0)){

				// Draw the current piece
				tetris.draw_piece();

				// Render a new piece preview.
				tetris.render_preview();

			} else {
				tetris.game_over();
				return;
			}

		}

	},

	/**
	 * Reconfigure the level.
	 * TODO: Levels should loop (or the game should end) if we reach the
	 * end of the level array.
	 */
	level_config: function(){

		var l_index = tetris.level-1;

		// Level wraparound.
		// TODO: Make this a config option.
		if(l_index >= tetris.levels.length){
			l_index = l_index % tetris.levels.length;
		}

		// Set the color palette
		tetris.colors = tetris.levels[l_index][1];

		// Set the block drawing func.
		//$(tetris.canvas).setBlockFunc(tetris.levels[l_index][2]);
                tetris.ctx.drawBlock = tetris.levels[l_index][2];
                tetris.pre_ctx.drawBlock = tetris.levels[l_index][2];

		// Set the effects 
		tetris.draw_anim = tetris.levels[l_index][3]; 
		tetris.clear_anim = tetris.levels[l_index][4];
		tetris.anchor_anim = tetris.levels[l_index][5]; 
		tetris.line_anim = tetris.levels[l_index][6]; 

		// TODO: Do the rest of the effects here too.

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
         * Get a movement closure.
         */
        get_move:function(h,v){
            var _h = h;
            var _v = v;

            return function(){
                tetris.move(_h,_v);
            };

        },

        /**
         * Get a rotation closure.
         */
        get_rotate:function(){
            return function(){
                tetris.rotate();
            };
        },

	/**
	 * Initiate keyboard controls.
	 *   The goal here is to get a good feel on all non-IE browsers.
	 *   TODO: Performance, feel, code cleanup.
	 */
	initiate_controls:function(){

		//left = 'tetris.move(-1,0)';
		//right = 'tetris.move(1,0)';
		//down = 'tetris.move(0,1)';
		//rotate = 'tetris.rotate()';
                
                // TODO: Make a closure with the proper tetris instance as the context.
                //var left = function(){ tetris.move(-1,0); };
                //var right = function(){ tetris.move(1,0); };
                //var down = function(){ tetris.move(0,1); };
                //var rotate = function(){ tetris.rotate(); };

                var left = tetris.get_move(-1,0);
                var right = tetris.get_move(1,0);
                var down = tetris.get_move(0,1);
                

		document.onkeydown = function(e){

			// Don't allow simultaneous movements.
                        for( var intr = 0; intr < 4; intr++){
                            if(tetris.interrupts[intr] != null){
                                clearInterval(tetris.interrupts[intr]);
                                tetris.interrupts[intr] = null;
                            }
                        }

			switch(e.keyCode){
				case 37:
                                tetris.move(-1,0);
                                tetris.interrupts[0] = setTimeout(tetris.continuous_movement(0, left), tetris.repeat_wait);
				break;
				case 38:
                                tetris.rotate();
				break;
				case 39:
                                tetris.move(1,0);
                                tetris.interrupts[2] = setTimeout(tetris.continuous_movement(2, right), tetris.repeat_wait); 
				break;
				case 40:
                                tetris.move(0,1);
                                tetris.interrupts[3] = setTimeout(tetris.continuous_movement(3, down), tetris.repeat_wait);
				break;
				case 80: tetris.toggle_pause(); break;	
			};


		};

		document.onkeyup = function(e){
			switch(e.keyCode){
                                case 37: clearInterval(tetris.interrupts[0]); tetris.interrupts[0] = null; break;
                                case 38: clearInterval(tetris.interrupts[1]); tetris.interrupts[1] = null; break;
                                case 39: clearInterval(tetris.interrupts[2]); tetris.interrupts[2] = null; break;
                                case 40: clearInterval(tetris.interrupts[3]); tetris.interrupts[3] = null; break;
			};
		};

	},

	/**
	 * Continuous movement.
	 * Sets a movement interval.
	 */
	continuous_movement:function(intr, func){
                var _intr = intr;
                return function(){
                    tetris.interrupts[_intr] = setInterval(func, tetris.move_speed);
                };
	},

	/**
	 * Trigger movement. Returns false (and no movement) if anchoring
	 * conditions are encountered.
	 * NOTE: This will trigger a redraw of the current piece if successful.
	 */
	move:function(h,v){

		piece = tetris.piece_stack[0][1];

		if(tetris.can_move(piece, h, v)){	
			tetris.move_current_piece(h, v);
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
		if( tetris.can_move(new_piece, 0, 0) ){
			tetris.redraw_current_piece(new_piece);
		}

	},


	/**
	 * Start the game! Only run this ONCE for each game!
	 * This should be usable as a new game method.
	 * TODO: Clean up.
	 */
	start:function(){


		// Create the html elements.
		elem = tetris.create_tetris_popup();
		tetris.create_tetris_container().appendTo(elem);

		// Set the canvasses and status section.
		tetris.canvas = document.getElementById(tetris.game_canvas_id);
		tetris.preview = document.getElementById(tetris.preview_canvas_id);
		
		
        	$(tetris.canvas).gridSetup(tetris.width,tetris.height,0);
		tetris.ctx = tetris.canvas.context; // TODO: Get rid of this!
		
		// Create a grid for the preview canvas
		$(tetris.preview).gridSetup(6,6,5);
		tetris.pre_ctx = tetris.preview.context; // TODO: Get rid of this!

		$(tetris.preview).blockShadows();
		//$(tetris.preview).effectsLoop();
	
		$(tetris.canvas).blockShadows();
        	$(tetris.canvas).effectsLoop();

		// Set rendering default.
		//$(tetris.canvas).setBlockFunc(tetris.l2_render_block);
		// FIXME: Make this more sane.
		tetris.levels = tetris.get_levels();
		tetris.level_config();

                // Initialize the movement interrupts
                tetris.interrupts = new Array(4);
                for(var x = 0; x < 4; x++){
                    tetris.interrupts[x] = null;
                }


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
	 * FIXME: We should handle this more efficiently.
	 */
	redraw_current_piece:function(new_piece){
		tetris.clear_piece();
		tetris.piece_stack[0][1] = new_piece;
		tetris.draw_piece();

		// Trigger immediate redraw. May be needed to avoid 'jumping'
		// TODO: Enable sliceable redrawing.
        	//tetris.ctx.effects();
	},

	/**
	 * Moves a piece, also clears and redraws.
	 * TODO: Try to integrate this with redraw_current_piece
	 */
	move_current_piece:function(h,v){
		tetris.clear_piece();
		
		// TODO: Replace with a map?
		piece = tetris.piece_stack[0][1]; 
		for(i = 0; i < piece.length; i++){
			piece[i][0] += h;
			piece[i][1] += v;
		}

		tetris.draw_piece();

		// Trigger immediate redraw. May be needed to avoid 'jumping'
		// TODO: Enable sliceable redrawing.
        	//tetris.ctx.effects();
	},

	/**
	 * Draw the level transition. 
	 * TODO: Make this configurable in the level array.
	 * FIXME: This may conflict with the column shifting operation!
	 *
	 */
	draw_level_transition:function(){

		// Loop through the board, and redraw all pieces.
		for(y = 0; y < tetris.height; y++){
			for(x = 0; x < tetris.width; x++){
				state = tetris.ctx.getState(x,y);
				if(state == 1){
					// TODO: make this configurable!
					// trigger a draw.
					tetris.ctx.setAnim(x,y,[ drawEffect(endChain()) ]);
				} else if(state == 2){
					break;
				}
			}
		}

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
		// TODO: Re-vamp piece creation system.
		piece = tetris.create_piece(tetris.piece_stack[1][0]);
		pattern = piece[1];

		// Draw the preview.
		for(i = 0; i < 4; i++){
			type = piece[0];

			// TODO: Preview drawing animations in level config.
			tetris.pre_ctx.setType(pattern[i][0] + 1, pattern[i][1] + 1, type-1);
			tetris.pre_ctx.setAnim(pattern[i][0] + 1, pattern[i][1] + 1, [ drawEffect(endChain()) ]);
		}

		// Trigger a drawing update.
		tetris.pre_ctx.effects();


	},


	/**
	 * Draw the current piece on the game board.
	 */
	draw_piece:function(){

		type = tetris.piece_stack[0][0];
		piece = tetris.piece_stack[0][1];

		// Tetrominos are always composed of 4 squares.
		// TODO: Can we enhance performance with better shape calculation?
		for(i = 0; i < 4; i++){
			tetris.ctx.setType(piece[i][0], piece[i][1], type-1); // TODO: Find a way to organize this type setting stuff better.
			tetris.ctx.setAnim(piece[i][0], piece[i][1], tetris.draw_anim());
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
			// TODO: Setting the animation shouldn't be necessary every time. A state toggle only.
			tetris.ctx.setAnim(piece[i][0], piece[i][1], tetris.clear_anim());
		}


	},

	/**************************************
	 * Level 1 rendering.
	 * TODO: Extract this stuff
	 **************************************/
	l1_colors: [
		[ "#fce94f", "#edd400", "#c4a000"],
		[ "#8ae234", "#73d216", "#4e9a06"],
		[ "#e9b96e", "#c17d11", "#8f5902"],
		[ "#fcaf3e", "#f57900", "#ce5c00"],
		[ "#ad7fa8", "#75507b", "#5c3566"],
		[ "#ef2929", "#cc0000", "#a40000"],
		[ "#729fcf", "#3465a4", "#204a87"]
	],


	l1_clear_anim: function(){
		return [ opEffect( 0.8, 0.0, 4, endChain()) ];
	},

	l1_draw_anim: function(){
		return [ drawEffect(endChain()) ];
	},

	l1_anchor_anim: function(){
		return [scaleEffect(1,1,0.9,0.9,2,scaleEffect(0.9,0.9,1,1,2,endChain()))];
	},

	l1_line_anim: function(){
		return [ opEffect(1.0, 0.0, 10, endChain()),
			 scaleEffect(1.0,1.0,0.5,0.5, 10, endChain()) ];
	},
                    

	/**
	 * Level 1: Render block prototype function.
	 */
	l1_render_block:function() {

		var type = this.getType(this.x,this.y);
                //var type = this.current[0];

		// shorthand for the radix coeffs
		var hc1 = this.hcoeff_1;
		var vc1 = this.vcoeff_1;

		var x = this.block_dimensions[0] / 2 - this.max_shadow;
		var y = this.block_dimensions[1] / 2 - this.max_shadow;

		var xh1 = -1 * x * hc1;
		var xh2 = x * hc1;
		var yh1 = -1 * y * vc1;
		var yh2 = y * vc1;

		// Save
		//ctx.save();

		this.beginPath();

		// Outer
		this.fillStyle = tetris.colors[type][1];
		this.shadowColor = tetris.colors[type][0];


		this.moveTo(xh2, y);
		this.quadraticCurveTo(x, y, x, yh2);
		this.lineTo(x, yh1);
		this.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		this.lineTo(xh1, -1 * y);
		this.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		this.lineTo(-1 * x, yh2);
		this.quadraticCurveTo(-1 * x, y, xh1, y);

		this.closePath();

		this.fill();

		// Outline
		this.strokeStyle = tetris.colors[type][0];
		this.stroke();
	
		// Remove the blur	
		this.shadowBlur = 0;
		
		// Inner
		this.fillStyle = tetris.colors[type][2];

		// Scale down
		this.scale(0.5,0.5);	

		this.beginPath();

		this.moveTo(xh2, y);
		this.quadraticCurveTo(x, y, x, yh2);
		this.lineTo(x, yh1);
		this.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		this.lineTo(xh1, -1 * y);
		this.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		this.lineTo(-1 * x, yh2);
		this.quadraticCurveTo(-1 * x, y, xh1, y);
		
		this.closePath();
		
		this.fill();
		
	},

	// TODO: Set some level 2 colors.
	l2_colors: [
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"],
		[ "#eeeeec", "#d3d7cf", "#babdb6"]
	],



	// TODO: Organize the custom block rendering stuff somewhere else!

	/**
	 * Level 2: Render block prototype function.
	 */
	l2_render_block:function() {

		//type = ctx.matrix[x][y][3];
		var type = this.getType(this.x,this.y);

		// shorthand for the radix coeffs
		var hc1 = this.hcoeff_1;
		var vc1 = this.vcoeff_1;

		var x = this.block_dimensions[0] / 2 - 2;
		var y = this.block_dimensions[1] / 2 - 2;

		var xh1 = -1 * x;// * hc1;
		var xh2 = x;// * hc1;
		var yh1 = -1 * y;// * vc1;
		var yh2 = y;// * vc1;


		this.shadowBlur = 0;

		// Outer
		this.fillStyle = tetris.colors[type][1];
		this.shadowColor = tetris.colors[type][0];

		this.beginPath();

		this.moveTo(xh2, y);
		this.quadraticCurveTo(x, y, x, yh2);
		this.lineTo(x, yh1);
		this.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		this.lineTo(xh1, -1 * y);
		this.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		this.lineTo(-1 * x, yh2);
		this.quadraticCurveTo(-1 * x, y, xh1, y);
		
		this.closePath();

		this.fill();

		// Outline
		this.strokeStyle = tetris.colors[type][0];
		this.stroke();

		// Inner
		this.fillStyle = tetris.colors[type][2];

		// Scale down
		this.scale(0.5,0.5);	

		this.beginPath();

		this.moveTo(xh2, y);
		this.quadraticCurveTo(x, y, x, yh2);
		this.lineTo(x, yh1);
		this.quadraticCurveTo(x, -1 * y, xh2, -1 * y);
		this.lineTo(xh1, -1 * y);
		this.quadraticCurveTo(-1 * x, -1 * y, -1 * x, yh1);
		this.lineTo(-1 * x, yh2);
		this.quadraticCurveTo(-1 * x, y, xh1, y);
		
		this.closePath();
		
		this.fill();
		
	},



	/*********************************************************************
	 * Levels (default config) 
	 *
	 * TODO: Support different preview configurations too.
	 *
	 * Template:
	 *   1: Level name
	 *   2: Level color palette(s)
	 *   3: Block rendering function(s) (TODO: Support multiple).
	 *   4: Piece draw animation(s)
	 *   5: Piece clear animation(s)
	 *   6: Anchor animation(s)
	 *   7: Line remove animation(s) (TODO: Should be special for tetris.)
	 *   8: TODO: Background animation(s)
	 *
	 *********************************************************************/
	get_levels: function(){
		return [
			[ 'Level 1', tetris.l1_colors, tetris.l1_render_block, tetris.l1_draw_anim, tetris.l1_clear_anim, tetris.l1_anchor_anim, tetris.l1_line_anim, null ],
			[ 'Level 2', tetris.l2_colors, tetris.l2_render_block, tetris.l1_draw_anim, tetris.l1_clear_anim, tetris.l1_anchor_anim, tetris.l1_line_anim, null ]
			];
	}

}
