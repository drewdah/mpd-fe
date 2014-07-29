function index(){
	
	// Prepare Mopidy instance
	var mpd = new Mopidy({
		autoConnect: false,
		webSocketUrl: "ws://192.168.1.117:6680/mopidy/ws/"
	});

	// Event for successful connection
	mpd.on("state:online", function () {
	    console.log("connected"); 
	    window.setTimeout(function(){
	    	window.location.href = "/now-playing";	
	    },2000);
	    
	});

	mpd.connect();
}
index();

