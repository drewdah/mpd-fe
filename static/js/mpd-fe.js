"use strict";
/*
	MPD-FE Object
 */
var Mpdfe = {

	config : {
		container: "#body-content",
		mopidyServer: "192.168.1.118:6680",
		templates: Handlebars.templates
	},
	mopidy: {},
	ui: {},

	playing: false,

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
			Mpdfe._onDisconnect();;
		});

		this.mopidy.on("event:trackPlaybackStarted", function(data) {
			console.log("playbackstart");
			  /*mopidy.playback.getTimePosition().then(processCurrentposition, console.error);
			 setPlayState(true);
			 setSongInfo(data.tl_track.track);
			 initPosTimer(); */
			Mpdfe._updateTrack(data.tl_track.track);
		});

		this.mopidy.on("event:trackPlaybackPaused", function(data) {
			console.log("playbackpaused");
			 /*
			 //setSongInfo(data.tl_track.track);
			pausePosTimer();
			setPlayState(false);
			*/
		});

		this.mopidy.on("event:playlistsLoaded", function(data) {
			console.log("playlistloaded");
			/*showLoading(true);
			getPlaylists();*/
		});

		this.mopidy.on("event:volumeChanged", function(data) {
			console.log("volumechange");
			/*if (!volumeChanging) {
			setVolume(data["volume"]);
			}*/
		});

		this.mopidy.on("event:playbackStateChanged", function(data) {
			console.log("playbackstatechanged");
			/*switch (data["new_state"]) {
			case "stopped":
			resetSong();
			break;
			case "playing":
			mopidy.playback.getTimePosition().then(processCurrentposition, console.error);
			resumePosTimer();
			setPlayState(true);
			break;
			} */
		});

		this.mopidy.on("event:tracklistChanged", function(data) {
			console.log("tracklistchange");
			//getCurrentPlaylist();
		});

		this.mopidy.on("event:seeked", function(data) {
			console.log("seeked");
			//setPosition(parseInt(data["time_position"]));
		});
	},

	/**
	 * Event fired on successful mopidy server connection
	 * @private
	 */
	_onConnect: function() {
		console.log("mpdfe: onConnect");
	},

	/**
	 * Event fired on disconnect from mopidy server
	 * @private
	 */
	_onDisconnect: function() {
		console.log("mpdfe: onDisconnect");
	},

	/**
	 * Update the UI with the provided track info
	 * @private
	 */
	_updateTrack: function(track) {
		if (track) {
			Mpdfe.ui.html("").append(
				// Drop in new Now Playing template
				Mpdfe.config.templates["now-playing"]({
					"artist" : track.artists[0].name,
					"album" : track.album.name,
					"song" : track.name,
					"genre" : track.genre
				})
			);
			Mpdfe._updateTrackPosition(0, track.length);
		} else {
			console.log("No current track");
		}
	},

	/**
	 *
	 * @param position
	 * @param length
	 * @private
	 */
	_updateTrackPosition: function(position, length){

		Mpdfe.ui.find(".time").html("").append(
			Mpdfe.config.templates["track-position"]({
				"position" : Mpdfe._convertTrackTime(position) + "/",
				"length" : Mpdfe._convertTrackTime(length)
			})
		);

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

			return minutes + ":" + seconds;
		} else {
			return "";
		}
	},


	/**
	 * Track Timer
	 */
	trackTimer: {
		timer: {},

		start: function(position, length){

		},

		stop: function(reset){

		},

		reset: function(){

		}
	}
};