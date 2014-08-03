$(function(){
	
	// Prepare Mopidy instance
	var mopidy = new Mopidy({
		autoConnect: false,
		webSocketUrl: "ws://" + Mpdfe.config.mopidyServer + "/mopidy/ws/"
	});

	// Event for successful connection
	mopidy.on("state:online", function () {
	    console.log("connected"); 
	    window.setTimeout(function(){
	    	window.location.href = "/now-playing";	
	    },2000);
	});

	mopidy.connect();
});

