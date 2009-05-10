// A simple console logging utility

var Log = function(){

	return{

		log:function(msg){
			output = document.getElementById('debug_container');
			output.innerHTML += msg + '<br/>';
		}

	};

}();

