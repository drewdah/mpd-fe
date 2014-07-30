$(function(){

	var template = Handlebars.templates["now-playing"];

	// Prepare Mopidy instance
	var mpd = new Mopidy({
		autoConnect: false,
		webSocketUrl: "ws://localhost:6680/mopidy/ws/"
	});

	// Event for successful connection
	mpd.on("state:online", function () {
	    console.log("connected"); 	    
		mpd.playback.getCurrentTrack().done(updateTrack);
	});

	mpd.on("event:track_playback_started", function(track){
		console.log("track change");
		updateTrack(track);
	});

	function updateTrack(track){
		if (track) {

			console.log("Currently playing:", track.name, "by", track.artists[0].name, "from", track.album.name);

			$("#body-content").html("").append(
				template({
					"artist" : track.artists[0].name,
					"album" : track.album.name,
					"song" : track.name,
					"genre" : track.genre
				})
			);
		} else {
			console.log("No current track");
		}
	}

	mpd.connect();
});