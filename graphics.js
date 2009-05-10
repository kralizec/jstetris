// Drawing methods


function Graphics(){

	/* Methods*/
	this.init = init;
	this.drawMatrix = drawMatrix;

	/* Vars */
	this.canvas = null;
	this.ctx = null;

	

	function init() {

		// Init the canvas object
		this.canvas = document.getElementById("game");
		this.ctx = this.canvas.getContext('2d');

		


	}


};
