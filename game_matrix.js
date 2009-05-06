// A fast game-board matrix.

function GameMatrix(){

	/* Methods */
	this.init = init;
	this.dump = dump;
	this.clear = clear;
	this.set_rules = set_rules;
	this.iterate = iterate;
	this.transpose = transpose;

	/* Private Methods */

	/* Vars */
	this.height = -1;
	this.width = -1;
	this.area = -1;
	this.bit_depth = 24;

	/* Matrix */
	this.matrix = null;

	/* Initialize the matrix. */
	function init(width, height) {
		
		// Set class vars
		this.width = width;
		this.height = height;
		this.area = width * height;

		// Compute board parameters
		this.matrix = [width];

		//for( 

	};

	function dump(){}
	function clear(){}
	function set_rules(){}
	function iterate(){}
	function transpose(){}


};

