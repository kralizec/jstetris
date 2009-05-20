// A fast game-board matrix.

function GameMatrix(){


	/* Methods */
	this.init = init;
	this.set_canvas = set_canvas;
	this.dump = dump;
	this.clear = clear;
	this.set_rules = set_rules;
	this.iterate = iterate;
	this.transpose = transpose;

	/* Private Methods */

	/* Vars */
	this.height = -1;
	this.width = -1;
	this.pixel_width = -1;
	this.pixel_height = -1;
	this.canvas_width = -1;
	this.canvas_height = -1;
	this.area = -1;
	this.bit_depth = 24;

	/* Matrix */
	this.matrix = null;

	/* Active tetromino */
	this.active_piece = null;
	this.active_type = -1;
	this.active_rinded = -1;

	/* Initialize the matrix. */
	function init(width, height) {
	
		// Debug
		Log.log('Creating game matrix');

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

	};

	/* Associate a canvas element with this object.
	 */
	function set_canvas(canvas_id) {

		this.canvas = document.getElementById(canvas_id);
		this.ctx = this.canvas.getContext('2d');

		this.canvas_height = this.canvas.height;
		this.canvas_width = this.canvas.width;

		this.pixel_height = this.canvas_height / this.height;
		this.pixel_width = this.canvas_width / this.width;

	};

	//this.clear_canvas = clear_canvas;
	this.clear_canvas = clear_canvas;
	function clear_canvas(){

		Log.log('Clearing the canvas');

		this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.fillRect(0,0,400,600);


	};


	function dump(){}
	function clear(){}
	function set_rules(){}
	function iterate(){}
	function transpose(){}

	this.draw_matrix = draw_matrix;
	function draw_matrix(){

		// Current row/col
		row = 0;
		col = 0;

		// Render the matrix.
		//for(line in this.matrix){
		for(y = 0; y < this.height; y++){
			//for(pixel in line){
			for(x = 0; x < this.width; x++){

				pixel = this.matrix[y][x];
				//Log.log('Drawing: ' + pixel);
			
				// Negate if necessary
				//if(pixel < 0){
				//	pixel *= -1;
				//}

				// Color
				color = 'black'
				switch(pixel){
					case null: break;
					case 0: break;
					case 1: color = "blue"; break;
					case 2: color = "brown"; break;
					case 3: color = "red"; break;
					case 4: color = "white"; break;
					case 5: color = "magenta"; break;
					case 6: color = "green"; break;
					case 7: color = "cyan"; break;
				};
				this.ctx.fillStyle = color;

				// Draw the pixel
				// TODO: FASTER
				off_x = col * this.pixel_width
				off_y = row * this.pixel_height
				this.ctx.fillRect(off_x, off_y, this.pixel_width, this.pixel_height);

				// Increment the col
				col++;
			}

			// Increment the row, reset col.
			row++
			col = 0;

		}

	};


	/* Removes a line, causing the rest of the lines to fall downwards.
	 *
	 */
	this.remove_line = remove_line;
	function remove_line(index){

		// Remove the old line.
		this.matrix.splice(index, 1);
		
		// Push a new line.
		this.matrix.unshift(new Array(this.width));

	};

	/* Creates a tetris piece.
	 *
	 * Format:
	 *    [ COLOR, TYPE, [ [P1],[P2],... ] ]
	 *
	 */
	this.create_piece = create_piece;
	function create_piece(type){
		
		// Create the piece pattern.
		pattern = null;
	
		axial = 2;
	
		switch(type){
			case 1: axial = 2; pattern = [[1,1],[1,1]];  break;
			case 2: axial = 2; pattern = [[2,0],[2,2],[2,0]]; break;
			case 3: axial = 2; pattern = [[3],[3],[3],[3]]; break;
			case 4: axial = 2; pattern = [[4,4],[4,0],[4,0]]; break;
			case 5: axial = 2; pattern = [[5,0],[5,0],[5,5]]; break;
			case 6: axial = 2; pattern = [[6,0],[6,6],[0,6]]; break;
			case 7: axial = 2; pattern = [[0,7],[7,7],[7,0]]; break;
		};

		// Set the active type and rotational index.
		// TODO: Refactor!
		this.active_type = type;
		this.active_rindex = axial;

		return pattern;

	}

	/* Place a piece on the matrix.
	 */
	this.set_piece = set_piece;
	function set_piece(){

		// DEBUG
		Log.log('Creating a game piece!');

		// TODO: Create a piece buffer!
		// Create a random piece.
		//piece = this.create_piece(5);
		piece = this.create_piece(Math.floor(Math.random()*7) + 1);

		//this.active_type = 5;
		//this.active_rindex = 2;

		// Randomly transpose the piece.

		// Set the active piece coordinates.
		startx = this.width / 2;
		row = 0;
		col = 0;

		// Reset the active piece.
		this.active_piece = [];

		//for(row in piece){
		for(y = 0; y < piece.length; y++){
			line = piece[y];
			
			//for(block in row){
			for(x = 0; x < line.length; x++){
				block = line[x];
				//Log.log('bleh');
				if(block != 0){
					//Log.log('bleh: ' + (startx + col) + " " + row);
					this.active_piece.push([startx + col, row]);
				}

				col++;

			}

			col = 0;
			row++;

		}


	}

	/* Draw the currenct piece on the game board.
	 */
	this.draw_piece = draw_piece;
	function draw_piece(){

		// Draw the active piece.
		for(x = 0; x < this.active_piece.length; x++){

			point = this.active_piece[x];

			// TODO:  Refactor this out! We can set the color when the piece is created!
			color = 'black'
			switch(this.active_type){
				case null: break;
				case 0: break;
				case 1: color = "blue"; break;
				case 2: color = "brown"; break;
				case 3: color = "red"; break;
				case 4: color = "white"; break;
				case 5: color = "magenta"; break;
				case 6: color = "green"; break;
				case 7: color = "cyan"; break;
			};

			this.ctx.fillStyle = color;

			// Draw the pixel
			px = point[0] * this.pixel_width;
			py = point[1] * this.pixel_height;
			//Log.log('Drawing: (' + px + ',' + py + ')');
			this.ctx.fillRect(px, py, this.pixel_width, this.pixel_height);
			

		}
		

	}

	/* Scan for and remove completed lines from the matrix.
	 */
	this.scan_lines = scan_lines;
	function scan_lines(){

		for(y = 0; y < this.height; y++){
			line_status = true;
			for(x = 0; x < this.width; x++){
				
				pixel = this.matrix[y][x];

				//if((pixel != null) && (pixel <= 0)){
				//Log.log('Pixel: ' + pixel);
				if(pixel == null || pixel <= 0){
					line_status = false;
				}
			}
			if(line_status){
				//Log.log('removing: ' + y);
				this.remove_line(y);
			}
		}

	};

	/* Sinks the piece. Returns true if successful, false if collision.
	 */
	this.move_down = move_down;
	function move_down(){

		temp_piece = [];

		for(x = 0; x < this.active_piece.length; x++){
			point = this.active_piece[x];
			temp_piece[x] = [ point[0], point[1] + 1];
		}

		if(this.can_move(temp_piece)){
			this.active_piece = temp_piece;
		} else {
			Log.log('Cannot Move down!');
			//this.anchor();
			// Anchor the currenct piece to the board.
			for(x = 0; x < this.active_piece.length; x++){
				point = this.active_piece[x];
				this.matrix[point[1]][point[0]] = this.active_type;
			} 

			this.anchored = true;

		}


	};

	/* Move left or right. (-) for left.
	 */
	this.move_horiz = move_horiz;
	function move_horiz(amount){
		
		temp_piece = [];

		for(x = 0; x < this.active_piece.length; x++){
			point = this.active_piece[x];
			temp_piece[x] = [ point[0] + amount, point[1]];
		}
		
		if(this.can_move(temp_piece)){
			this.active_piece = temp_piece;
		} else {
			Log.log('Cannot Move!');	
		}	

	}

	/* Detect anchoring conditions. Returns false if piece must be anchored.
	 */
	this.can_move = can_move;
	function can_move(piece){

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


	/* Start the game!
	 */
	this.start = start;
	function start(ref){

		ref.interval_id = setInterval( function(){
			ref.iterate();
		}, 500);

	};

	/* Toggle the pause state.
	 */
	this.toggle_pause = toggle_pause;
	function toggle_pause(ref){

		if(ref.interval_id){
			clearInterval(ref.interval_id);
			ref.interval_id = null;
		} else {
			ref.start(ref);
		}

	};

	/* Iterate.
	 */
	this.iterate = iterate;
	function iterate(){

		// Create a new piece if this is the beginning, or if anchoring ocurred.
		// Also, scan for lines.
		if(this.anchored){
			this.scan_lines();
			this.set_piece();
			this.anchored = false;
		}

		// Redraw
		this.draw_matrix();
		this.draw_piece();

		// Process user input. Rotation and Horizontal movement.
		// ...or move down.
		this.move_down();

	};


	this.kb_input = kb_input;
	function kb_input(e){

		Log.log('key pressed!' + e.keyCode);

		switch(e.keyCode){

			case 37: this.move_horiz(-1); break;
			case 38: this.rotate(); break;
			case 39: this.move_horiz(1); break;
			case 40: this.move_down(); break;

		};

	};
	

	/* Detect rotation conditions. Returns false if piece cannot rotate.
	 */
	this.can_rotate = can_rotate;
	function can_rotate(){

	};

	this.rotate = rotate;
	function rotate(){

		piece = this.active_piece;
		new_piece = [];

		// Calculate block center
		r_x = 0;
		r_y = 0;
		for( x = 0; x < 4; x++ ){
			r_x += piece[x][0];
			r_y += piece[x][1];
		}
		r_x = Math.floor(r_x / 4);
		r_y = Math.floor(r_y / 4);

		Log.log('RX: ' + r_x + ' RY: ' + r_y);

		// ... TRANSFORM!!!
		for( x = 0; x < 4; x++ ){

			x1 = piece[x][0];
			y1 = piece[x][1];
			
			t_x = y1 + r_x - r_y;
			t_y = r_x + r_y - x1;

			new_piece[x] = [t_x,t_y];

		}

		// Calculate transform validity
		if( this.can_move(new_piece) ){
			this.active_piece = new_piece;
		} else {
			Log.log("Cannot rotate!");
		}



	};



	/* Anchors the current piece to the board.
	 */
	this.anchor = anchor;
	function anchor(){

		// Anchor the currenct piece to the board.
		for(x = 0; x < this.active_piece.length; x++){
			point = this.active_piece[x];
			this.matrix[point[1]][point[0]] = this.active_type;
			Log.log('Point (' + point[0] + ',' + point[1] + ') Type: ' + this.active_type);
		} 

		this.anchored = true;

	};

	this.random_matrix = random_matrix;
	function random_matrix(){
		
		for(y = 0; y < this.height; y++){
			for(x = 0; x < this.width; x++){
				this.matrix[y][x] = Math.floor(Math.random()*8)
				//this.matrix[y][x] = y;
			}
		}

	};

};

