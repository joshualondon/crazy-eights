(function($) {

    // --------
    // DEBUG
    // --------
    var DEBUG = false;
    if (DEBUG) {
        var console = {
            log: function(){
            var message = '';
            for (var i = 0; i < arguments.length; i++) {
                message += arguments[i] + ' ';
            }
            $('.console').html(
                $('.console').html() + message + '\n');
            }
        };
    } else {
        var console = window.console || {log:function(){}};
    }



    // --------
    // Schedule Tables
    // --------
    var __scheduleTable = {};
    var __scheduleId = 0;
    var schedule = function(callback, table, scope, error) {
        var i = 0;
        var id = __scheduleId++;
        __scheduleTable[id] = true;

        var tick = function() {

            if (!__scheduleTable[id]) {
                return;
            }

            if (i < table.length) {
                try {
                    callback.call(scope || window, table[i], i);
                    setTimeout(tick, table[i]);
                    i++;
                } catch(e) {
                    error = error || function(){};
                    if (error) {
                        error(e, table[i], i);
                    }
                }
            }
        };
        tick();
    };

    var clearSchedule = function() {
        __scheduleTable = {};
    };



    // --------
    // Covert milliseconds
    // --------
    var convertMillis = function(ms) {
        return {
            minutes: Math.floor(ms/60000),
            seconds: Math.floor(ms/1000)%60,
            millis: ms%1000
        };
    };




    // --------
    // Pad the seconds
    // --------
    var pad = function (n) {
        return n > 9 ? n+'':'0'+n;
    };





    // --------
    // Set the default timer vals
    // --------
    var TBTimer = function(config) {
        var self = this;
        this.resolution = config.resolution || 10;
        config.specs = config.specs || {};
        this.specs = {
            rounds: config.specs.rounds || 8,
            rest: config.specs.rest || 10,
            work: config.specs.work || 40
    };

    var current = {};

	this.displayEl = $('.timer-display')[0];

	config.sounds = config.sounds || {};
	var sounds = {};
	var toLoad = 0;
	var loadingSounds = false;


	// --------
    // Play function
    // --------
	this.sounds = {
		soundsAvailable: false,
		tracks: sounds,
		play: function(name) {
			console.log('Trying to play sound', name);

			if (this.soundsAvailable && this.tracks[name]) {
				console.log('Calling play() on sound', name);
				this.tracks[name].play();
				console.log(' -> track:', this.tracks[name]);
				console.log(' -> shoud start playing any minute now...');
			} else {
				console.log('Cannot play sound ', name,'. soundsAvailable=', this.soundsAvailable,'; this.tracks[name]=', this.tracks[name]);
			}
		}
	};

	// --------
    // Load the sounds
    // --------
	this.loadSounds = function() {

		if (loadingSounds) {
			return;
		}

		loadingSounds = true;

		for (var sndName in config.sounds) {
			if (config.sounds.hasOwnProperty(sndName)) {
				var sound = new Audio(config.sounds[sndName]);

				sound.addEventListener('error', function failed(e) {
					// audio playback failed - show a message saying why
					// to get the source of the audio element use $(this).src
					switch (e.target.error.code) {
							case e.target.error.MEDIA_ERR_ABORTED:
							console.log('You aborted the video playback.');
						break;
							case e.target.error.MEDIA_ERR_NETWORK:
							console.log('A network error caused the audio download to fail.');
						break;
							case e.target.error.MEDIA_ERR_DECODE:
							console.log('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
						break;
							case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
							console.log('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
						break;
							default:
							console.log('An unknown error occurred.');
						break;
					}
				}, true);

				toLoad++;
				sound.addEventListener("canplay", function() {
					toLoad--;
					console.log('Some sound loaded.',  ' - ', toLoad);
					if (toLoad == 0) {
						self.soundsLoaded();
					}
				}, false);

				sounds[sndName] = sound;
				sound.load();
				console.log('Load sound: ', sndName, ' - ', toLoad);

				sound.addEventListener('playing', function() {
					console.log('Sound', sndName, 'is playing');
				}, true);

			}
		}
	};

	// --------
	// Check to see if sounds loaded
	// --------
	this.soundsLoaded = function() {
		console.log('Sounds available');
		this.sounds.soundsAvailable = true;
	};

	// --------
	// Load the sounds on ready
	// --------
	$(document).ready(function() {
		self.loadSounds();
	});




	// --------
	// Get the values from the HTML settings
	// Do error checking
	// --------
	this.getValues = function() {
		var rounds = $('.input-rounds').val();
		var rest = $('.input-rest').val();
		var work = $('.input-work').val();

		$('.input-rounds').removeClass('state-error-mark');
		$('.input-rest').removeClass('state-error-mark');
		$('.input-work').removeClass('state-error-mark');

		// error checking
		var correct = true;
		try {
			rounds = parseInt(rounds);
		} catch(e) {
			$('.input-rounds').addClass('delaystate-error-mark');
			correct =  false;
		}

		if (isNaN(rounds) || rounds <= 0) {
			$('.input-rounds').addClass('state-error-mark');
			correct =  false;
		}

		try {
			rest = parseFloat(rest);
		} catch(e) {
			$('.input-rest').addClass('state-error-mark');
			correct =  false;
		}

		if ( isNaN(rest) || rest <= 0) {
			$('.input-rest').addClass('state-error-mark');
			correct =  false;
		}

		try {
			work = parseFloat(work);
		} catch(e) {
			$('.input-work').addClass('state-error-mark');
			correct =  false;
		}

		if ( isNaN(work) || work<= 0) {
			$('.input-work').addClass('state-error-mark');
			correct =  false;
		}

		if (!correct) {
			this.notify('Incorrect!');
			return false;
		}


		this.specs = {
			rounds: rounds,
			rest: rest,
			work: work
		};

		return this.specs;
	};



	// --------
	// START TIMER
	// --------
	this.start = function() {

		if (this.running) {
			return;
		}

		clearSchedule();

		var s = this.getValues();

		if (s) {
			var rs = [];
			var schedules = [];

			for (var i = 0; i < s.rounds; i++) {
				rs.push({
					total: s.rest * 1000,
					round: i+1,
					type: 'rest'
				});
				schedules.push(s.rest*1000);

				rs.push({
					total: s.work * 1000,
					round: i+1,
					type: 'work'
				});
				schedules.push(s.work*1000);
			}
			schedules.push(500);
			this.rounds = rs;
			console.log('start');

			this.running = true;
			schedule(function(delay, rn){
			this._doRound(rn);
			}, schedules, this);

		$('.timer-start').text('Stop');
			return {s:schedules, r:rs};
		}
	};


	// --------
	// STOP TIMER
	// --------
	this.stop = function() {
		this.running = false;
		$('.timer-start').text('Start');
		this.notifyForRound('-', 'rest');

		if (current.timerId) {
			clearInterval(current.timerId);
			current.alreadyWarned = false;
			current.round.end = new Date().getTime();
		}

		this.rounds = [];
		this.updateDisplay(0);

	};

	this.resetCircles = function() {

		$('.circle-animation').css('stroke-dashoffset', '440px');
	}





	// --------
	// Animate the circles
	// --------
	function sketchCircle() {

		var time = $('.input-work').val();
		var initialOffset = '440';
		var i = 1

		/* Need initial run as interval hasn't yet occured... */
		$('#sketch_circle').css('stroke-dashoffset', initialOffset-(1*(initialOffset/time)));

		var interval = setInterval(function() {
			if (i == time) {
			  clearInterval(interval);
			  $('#sketch_circle').css('stroke-dashoffset', initialOffset);
				  return;
			}
			$('#sketch_circle').css('stroke-dashoffset', initialOffset-((i+1)*(initialOffset/time)));
			i++;
		}, 1000);
	}



	function breakCircle() {

		var time = $('.input-rest').val();
		var initialOffset = '440';
		var i = 1;

		/* Need initial run as interval hasn't yet occured... */
		$('#break_circle').css('stroke-dashoffset', initialOffset-(1*(initialOffset/time)));

		var interval = setInterval(function() {

			if (i == time) {
				clearInterval(interval);
				$('#break_circle').css('stroke-dashoffset', initialOffset);
				return;
			}

			$('#break_circle').css('stroke-dashoffset', initialOffset-((i+1)*(initialOffset/time)));
			i++;

		}, 1000);

	}













	// --------
    // Do the rounds
    // --------
	this._doRound = function(rn) {

		if (!this.running) {
			return;
		}

		// stop current if running ....
		if (current.timerId) {
			clearInterval(current.timerId);
			current.alreadyWarned = false;
			current.round.end = new Date().getTime();
		}

		this.updateDisplay(0);
		var self = this;

		if (this.rounds[rn]) {
			var __tick = function() {

				if (!self.running) {
					return;
				}

				var currentTime = new Date().getTime();
				var elapsedTime = currentTime - self.rounds[rn].start;
				var dtm = self.rounds[rn].total - elapsedTime;

				if (dtm > 0) {
					self.updateDisplay(dtm);

					if (dtm <= 5000 && self.rounds[rn].total >= 5000 && !current.alreadyWarned) {
						self.sounds.play('warning');
						current.alreadyWarned = true;
					}
				} else {
					self.updateDisplay(0);
					if (current.timerId) {
						clearInterval(current.timerId);
						current.alreadyWarned = false;
						current.round.end = new Date().getTime();
					}
				}
			}

			current.round = this.rounds[rn];
			current.round.start = new Date().getTime();
			current.timerId = setInterval(__tick, this.resolution);
			var roundNumber = Math.floor(rn/2) + 1;
			this.notifyForRound(roundNumber, current.round.type);

			if (current.round.type == 'rest') {
				this.notify('Break!');
				// need to reset break circle
				breakCircle();

				if (rn != 0) {
					this.sounds.play('end-round');
				}

			} else {
				this.notify('Sketch!');
				this.sounds.play('start');
				sketchCircle();
			}
		} else {
			this.notify('Bravo!');
			this.sounds.play('end');
			this.stop();
		}
	};



	// --------
	// Update round number
	// --------
	this.notifyForRound = function(rn, type) {
		$('.round-number').html(rn);
		$('.round-type').html(type=='rest' ? 'Break':'Sketch');
	};

	var self = this;
	$('.timer-start').click(function() {
		if (!self.running) {
			self.start();
		} else {
			self.stop();
			self.notify('Stopped!');
		}
	});





	// --------
	// Display the counter
	// --------
	this.updateDisplay = function(ms) {
		var tm = convertMillis(ms);
		this.displayEl.innerHTML =
			'<span class="minutes">' + pad(tm.minutes) + '</span>' +
			'<span class="colon">:</span>' +
			'<span class="seconds">' + pad(tm.seconds) + '</span>'
	};




	// --------
	// Throw the action notifications
	// --------
	this.notify = function(message) {

		$('.global-notification').text(message);

		$('.global-notification').addClass('is-visible').delay(1000).queue(function(next) {
			$(this).removeClass('is-visible');
			next();
		});

		$('body').addClass('action-overlay-visible').delay(1000).queue(function(next) {
			$(this).removeClass('action-overlay-visible');
		next();
		});
	};



	// --------
	// Settings toggle
	// --------
	$('.settings-trigger').on('click', function() {
		$(this).toggleClass('is-active');
		$('.timer-options').toggleClass('is-visible');
	});














      $(document).keypress(function(e){
         switch(e.which){
            case 32: // space
            case 115: // s
            case 13: // return
            // these are toggle
               if(!self.running){
                  self.start();
               }else{
                  self.stop();
                  self.notify('Stopped!');
               }
               break;
            case 112: // p
               self.stop();
               self.notify('Stopped!');
               break;
            case 114: // r
               self.start();
               break;
         }
      });


   };



		$(document).ready(function(){

			// load sounds


			tm = new TBTimer({
			sounds: {
				'start':		'/assets/audio/smb_powerup.wav',
				'end':			'/assets/audio/smb_stage_clear.wav',
				'end-round':	'/assets/audio/smb_coin.wav',
				'warning':		'/assets/audio/smb_warning.wav'
			}
		});


	});

})(jQuery);
