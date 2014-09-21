"use strict";
/*
	MPD-FE Object
 */
var Mpdfe = {

	config : {
		container: "#body-content",
		mopidyServer: "localhost:6680",
		templates: Handlebars.templates,
		audioDbApiKey: "1"
	},
	mopidy: {},
	ui: {},
	albumCache: {},

	/**
	 * Initialize ui with provided config
	 * @param config
	 */
	init: function(config){

		// Extend config
		this.config = $.extend({},this.config,config);

		// Get ref to container for ui
		this.ui = $(this.config.container);

		// Register events for mopidy server
		this._registerEvents();
	},

	/**
	 * Connect to Mopidy instance
	 */
	connect: function(){
		this.mopidy.connect();
		this._onConnect();
	},

	/**
	 * Register event handlers for interfacing with mopidy
	 * @private
	 */
	_registerEvents: function(){

		// Prepare Mopidy instance
		this.mopidy = new Mopidy({
			autoConnect: false,
			webSocketUrl: "ws://" + Mpdfe.config.mopidyServer +"/mopidy/ws/",
			callingConvention: "by-position-or-by-name",
			console: false
		});

		// Event for successful connection
		this.mopidy.on("state:online", function () {
			Mpdfe._onConnect();
			Mpdfe.mopidy.playback.getCurrentTrack().done(Mpdfe._updateTrack);
		});

		this.mopidy.on("state:offline", function() {
			Mpdfe._onDisconnect();
		});

		this.mopidy.on("event:trackPlaybackStarted", function(data) {
			Mpdfe._updateTrack(data.tl_track.track);
		});

		this.mopidy.on("event:trackPlaybackPaused", function(data) {
			Mpdfe.trackTimer.stop();
		});

		this.mopidy.on("event:volumeChanged", function(data) {
			Mpdfe._showStatus("Volume: "+data.volume+"%", 1000);
		});

		this.mopidy.on("event:playbackStateChanged", function(data) {
			switch (data["new_state"]) {
				case "paused":
					Mpdfe.trackTimer.stop();
					Mpdfe._showStatus("Track: PAUSE", 1000);
				break;

				case "stopped":
					Mpdfe.trackTimer.stop();
					Mpdfe._showStatus("Track: STOP", 1000);
				break;

				case "playing":
					Mpdfe._syncTrackTimer();
					Mpdfe._showStatus("Track: PLAY", 1000);
				break;
			}
		});

		this.mopidy.on("event:tracklistChanged", function(data) {
			// show status, possibly loading
			Mpdfe._showStatus("Loading Next Track...");
		});

		this.mopidy.on("event:seeked", function(data) {
			Mpdfe._syncTrackTimer();
		});
	},

	/**
	 * Event fired on successful mopidy server connection
	 * @private
	 */
	_onConnect: function() {
		// do something on connect
	},

	/**
	 * Event fired on disconnect from mopidy server
	 * @private
	 */
	_onDisconnect: function() {
		// do something on disconnect
	},

	/**
	 * Update the UI with the provided track info
	 * @private
	 */
	_updateTrack: function(track) {

		if (track) {

			var trackType = Mpdfe._getTrackType(track);

			switch (trackType) {

				// Local Tracks
				case "local":
				case "gmusic":

					// Stop the track timer
					Mpdfe.trackTimer.stop(true);

					// Set track length
					Mpdfe.trackTimer.duration = track.length;

					var artist = (track.artists) ? track.artists[0].name : "",
						album = (track.album) ? track.album.name : "",
						song = track.name || "",
						genre = track.genre || "";

					// Update the track info
					Mpdfe.ui.html(
						// Drop in new Now Playing template
						Mpdfe.config.templates["now-playing"]({
							"type" : trackType,
							"artist" : artist,
							"album" : album,
							"song" : song,
							"genre" : genre
						})
					);

					// Sync the track timer with its playback position
					Mpdfe._syncTrackTimer();

					// Update album art
					if(artist && album){
						Mpdfe._updateAlbumArt(artist, album);
					}

				break;

				// TuneIn Radio
				case "tunein":

					// Stop the track timer
					Mpdfe.trackTimer.stop(true);

					// Update the track info
					Mpdfe.ui.html(
						// Drop in new Now Playing template
						Mpdfe.config.templates["now-playing"]({
							"type": trackType,
							"artist": "TuneIn Radio",
							"song" : track.name
						})
					);

				break;

				// Default fallback
				default:

					// Stop the track timer
					Mpdfe.trackTimer.stop(true);

					// Update the track info
					Mpdfe.ui.html(
						// Drop in new Now Playing template
						Mpdfe.config.templates["now-playing"]({
							"type": trackType,
							"song" : track.name
						})
					);

					// Sync the track timer with its playback position
					Mpdfe._syncTrackTimer();

				break;
			}

		} else {

			// Update the track info
			Mpdfe.ui.html(
				// Drop in new Now Playing template
				Mpdfe.config.templates["now-playing"]({
					"artist": "No Artist",
					"album": "No Album",
					"song": "No Title",
					"status": "Ready to Play!",
					"status-class": "ready"
				})
			);

		}
	},

	/**
	 *
	 * @param artist
	 * @param album
	 * @private
	 */
	_updateAlbumArt: function(artist, album){

		var hash = (artist + "-" + album).toLowerCase();

		if(Mpdfe.albumCache[hash]){
			console.log("album already cached");
			Mpdfe.ui.find(".art").css('background-image', 'url(' + Mpdfe.albumCache[hash] + ')');
		} else {
			$.ajax({
				url: "/album-art",
				data: {
					s: artist,
					a: album
				}
			}).success(function(data){

				Mpdfe.albumCache[hash] = data.album[0].strAlbumThumb + "/preview";
				Mpdfe.ui.find(".art").removeClass("cover").addClass("cover").css('background-image', 'url(' + Mpdfe.albumCache[hash] + ')');

			}).error(function(err){
				console.log(err)
			});
		}
	},

	/**
	 * Updates the track position based on the provided values
	 * @param position
	 * @param duration
	 * @private
	 */
	_updateTrackPosition: function(position, duration){
		var tpos = Mpdfe.ui.find(".track-position"),
			pos = tpos.find(".position"),
			dur = tpos.find(".length"),
			progress = tpos.find(".progress");

		pos.html(Mpdfe._convertTrackTime(position) + " / ");
		dur.html(Mpdfe._convertTrackTime(duration));
		progress.css("width", Math.ceil(position/duration*100) +"%");
	},

	/**
	 * Sets the track timer to match the playback position
	 * @private
	 */
	_syncTrackTimer: function(){
		// Update the time;
		Mpdfe.mopidy.playback.getTimePosition().then(function(pos){
			Mpdfe.trackTimer.start(pos);
		}, console.error);
	},

	/**
	 * Converts time in MS to minutes and seconds
	 * @param time
	 * @returns {string}
	 * @private
	 */
	_convertTrackTime: function(time) {
		if(time){
			var seconds=Math.floor((time/1000)%60),
				minutes=Math.floor((time/(1000*60))%60);

			seconds = (seconds < 10 ? '0' : '') + seconds;

			return minutes + ":" + seconds;
		} else {
			return "";
		}
	},


	/**
	 * Returns a type string based on track uri
	 * @param track
	 * @private
	 */
	_getTrackType: function(track) {
		return track.uri.substr(0,track.uri.indexOf(":"));
	},


	/**
	 * Shows a status message with optional timeout before fading out
	 * @param status
	 * @param timeout
	 * @private
	 */
	_showStatus: function(status, timeout){
		var $status = Mpdfe.ui.find(".status");

		$status.html(status).removeClass("fade").addClass("show");

		if(timeout){
			setTimeout(function(){
				$status.addClass("fade").removeClass("show");
			}, timeout);
		}
	},

	/**
	 * Track Timer
	 */
	trackTimer: {
		timer: null,
		duration: 0,
		position: 0,

		start: function(position, duration){

			Mpdfe.trackTimer.stop();

			// Update position
			Mpdfe.trackTimer.position = position || Mpdfe.trackTimer.position;
			Mpdfe.trackTimer.duration = duration || Mpdfe.trackTimer.duration;

			this.timer = setInterval(function(){
				Mpdfe.trackTimer.position += 1000;
				if(Mpdfe.trackTimer.position <= Mpdfe.trackTimer.duration){
					Mpdfe._updateTrackPosition(Mpdfe.trackTimer.position, Mpdfe.trackTimer.duration);
				}else{
					Mpdfe.trackTimer.stop();
				}
			},1000);

		},

		stop: function(reset){
			clearInterval(this.timer);
			if(reset){
				Mpdfe.trackTimer.reset()
			}
		},

		reset: function(){
			Mpdfe.trackTimer.position = 0;
			Mpdfe.trackTimer.duration = 0;
		}
	}
};