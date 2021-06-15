/* 
 * Panzer HTML5 Audio Playlist
 * Version: 1.0
 * Author: http://codecanyon.net/user/liviu_cerchez
 */

(function($) {
	var deviceAgent = navigator.userAgent.toLowerCase();
	var iOS = deviceAgent.match(/(iphone|ipod|ipad)/);

	var methods = {
		init : function(options) {

			var settings = $.extend({
				layout         : 'mini', // sets the layout style: mini, big
				theme          : 'dark', // sets the theme: dark, light, custom
				expanded       : false,  // wheater to expand the player at layout full width
				title          : '',     // set a song title to be displayed before the playlist
				cover          : '',     // album cover
				volume         : 100,    // initial volume of the audio player
				show_prev_next : false,  // show previous and next controls
				show_list      : true,   // show list of files to be played
				pause_others   : true,   // determines if the player should pause when other panzer player is played
				auto_start     : false,  // play first song when the player is loaded
				auto_advance   : true,   // play next song when the current one ends
				repeat_all     : false,  // play first song after the playlist ends
				outdated_text  : 'Browser is outdated, but you can still download and listen to the audio files on your computer.',
				auto_numbering : false
			}, options);

			if (settings.volume < 0 ) settings.volume = 0;
			if (settings.volume > 100 ) settings.volume = 100;

			// build the player
			var additional_classes = '';
			if (settings.layout == "big") additional_classes = ' panzerlist-big';
			additional_classes += ' panzerlist-' + settings.theme;
			if (settings.expanded) additional_classes += ' panzerlist-expand';
			if (!settings.show_prev_next) additional_classes += ' hide-prev-next';
			if (!settings.show_list) additional_classes += ' hide-list';
			if (settings.pause_others) additional_classes += ' pause-others';
			if (settings.auto_advance) additional_classes += ' auto-advance';
			if (settings.repeat_all) additional_classes += ' repeat-all';

			var test_audio = document.createElement("audio");
			if (!!(test_audio.canPlayType)) {
				controls = '<div class="controls"><span class="play"><em></em></span><div class="prev-next"><span class="prev"></span><span class="next"></span></div></div><div class="progress-wrapper"><div class="progress"><div class="elapsed" style="width:0;display:none"></div></div></div><span class="duration">00:00</span><div class="volume-wrapper"><span></span><div class="volume"><div class="set" style="width:'+settings.volume+'%"></div></div></div>';
				if (!settings.title || 0 === settings.title.length) {
					song_title = '';
				}
				else {
					song_title = '<div class="title">' + settings.title + '</div>';
				}
				if (settings.cover != '') {
					album_cover = '<div class="cover"><img src="'+settings.cover+'" alt="" /></div>';
					if (settings.show_list) additional_classes += ' hide-list';
				}
				else {
					album_cover = '';
				}
				$player = $('<div class="panzerlist' + additional_classes + '">' + song_title + album_cover + '<div class="list"></div><div class="player">' + controls + '</div></div>');

				$('.play',$player).click(function(e) {
					if ($(this).hasClass('play')) {
						$('.panzerlist.pause-others').each(function(){
							var data = $(this).find('a.active').data('panzerlist');
							if ( data && !data.audio.paused ) data.audio.pause();
						});
						$('.panzer.pause-others').each(function(){
							var data = $(this).data('panzer');
							if ( data && !data.audio.paused ) data.audio.pause();
						});
					}
					data = $(this).parents('.panzerlist').find('.list a.active').data('panzerlist');
					if ( data.audio.paused ) {
						data.audio.play();
					} else {
						data.audio.pause();
					}
				});
				$('.prev,.next',$player).click(function(e) {
					$active = $(this).parents('.panzerlist').find('.list a.active');
					data = $active.data('panzerlist');
					if ($(this).hasClass('prev')) {
						if (!$active.is(':first-child'))
							$next = $active.prev('a');
						else {
							if (data.player.hasClass('repeat-all'))
								$next = data.player.find('.list a:last');
							else
								return;
						}
					} else {
						if (!$active.is(':last-child'))
							$next = $active.next('a');
						else {
							if (data.player.hasClass('repeat-all'))
								$next = data.player.find('.list a:first');
							else
								return;
						}
					}
					data.audio.pause();
					data.audio.currentTime = 0;
					$next.trigger('click');
				});

				var leftButtonDown = false;
				$('.volume',$player).mousedown(function(e){
					if(e.which === 1) {
						leftButtonDown = true;
						changeVolume($(this),e);
					}
				}).mouseup(function(e){
					if(e.which === 1) leftButtonDown = false;
				}).mousemove(function(e){
					if(e.which === 1 && leftButtonDown) {
						changeVolume($(this),e);
					}
				});
				function changeVolume($this,e) {
					var offset = $this.offset();
					var x = e.pageX - offset.left;
					var percent = 100 * x / ($this.width()+1);
					if (percent < 0) percent = 0;
					if (percent > 100) percent = 100;
					$elems = $this.parents('.panzerlist').find('.list a');
					$elems.each(function() {
						data = $(this).data('panzerlist');
						data.audio.volume = percent / 100;
					});
				}

				$('.progress',$player).click(function(e){
					var offset = $(this).offset();
					var x = e.pageX - offset.left;
					var percent = 100 * x / ($(this).width()+1);
					if (percent < 0) percent = 0;
					if (percent > 100) percent = 100;
					$audio_el = $(this).parents('.panzerlist').find('.list a.active');
					data = $audio_el.data('panzerlist');
					var time = Math.round(data.audio.duration / 100 * percent);
					if ( data.audio.readyState === 0 ) {
						data.audio.addEventListener('canplay', function() {
							data = $(this).data('panzerlist');
							data.audio.currentTime = time;
						});
					} else {
						data.audio.currentTime = time;
					}
				});

				function panzerlist_audio_play() {
					data = $(this).data('panzerlist');
					$('.play',data.player).toggleClass('play pause');
				}
				function panzerlist_audio_pause() {
					data = $(this).data('panzerlist');
					$('.pause',data.$player).toggleClass('play pause');
				}
				function panzerlist_audio_ended() {
					data = $(this).data('panzerlist');
					data.audio.pause();
					if (data.player.hasClass('auto-advance')) {
						$active = data.player.find('.list a.active');
						if (!$active.is(':last-child'))
							$next = $active.next('a');
						else {
							if (data.player.hasClass('repeat-all'))
								$next = data.player.find('.list a:first');
							else
								return;
						}
						$next.trigger('click');
					}
				}
				function panzerlist_audio_timeupdate() {
					data = $(this).data('panzerlist');
					var percent = data.audio.currentTime * 100 / data.audio.duration;
					if (!isNaN( percent )) {
						var m, m_str, s;
						m = Math.floor( data.audio.currentTime / 60 );
						m_str = isNaN( m ) ? '00' : ( m >= 10 ) ? m : '0' + m;
						s = Math.floor( data.audio.currentTime % 60 );
						s = isNaN( s ) ? '00' : ( s >= 10 ) ? s : '0' + s;
						if ( !isNaN( m ) && m > 99 ) $('span.duration',data.player).addClass('small');
						$('span.duration',data.player).html(m_str + ':' + s);
						if (percent == 0)
							$('.elapsed',data.player).hide().css('width',0);
						else
							$('.elapsed',data.player).show().css('width', percent+'%');
					}
				}
				function panzerlist_audio_volumechange() {
					data = $(this).data('panzerlist');
					var percent = data.audio.volume * 100;
					if (percent == 0)
						$('.volume .set',data.player).hide().css('width',0);
					else
						$('.volume .set',data.player).show().css('width', percent+'%');
				}
				function playlist_element_click(e){
					e.preventDefault();
					$this = $(this);
					$('.panzerlist.pause-others .list a.active').not($this).each(function() {
						var data = $(this).data('panzerlist');
						if ( data ) {
							if ( !data.audio.paused ) data.audio.pause();
						}
					});
					data = $(this).parents('.panzerlist').find('.list a.active').data('panzerlist');
					$isactive = $(this).hasClass('active');
					if ( !data.audio.paused ) {
						if (!$isactive) data.audio.pause();
						data.audio.currentTime = 0;
					}
					if ($isactive) {
						data.audio.play();
					} else {
						try {
							data.audio.currentTime = 0;
						} catch(err) { }
						data = $(this).data('panzerlist');
						$(this).parents('.panzerlist').find('.list a').removeClass('active');
						$(this).addClass('active');
						data.audio.play();
					}
				}

				$i=0;
				this.each(function() {
					var $this = $(this), audio = $this.get(0);
					if (!$this.is('audio')) return; // check if we are dealing with an audio HTML tag
					if ($this.data('panzerlist')) return;
					audio.volume = settings.volume / 100;
					// TODO: check if autostart attribute is present
					// audio.pause();
					audio.addEventListener("play", panzerlist_audio_play);
					audio.addEventListener("pause", panzerlist_audio_pause);
					audio.addEventListener("ended", panzerlist_audio_ended);
					audio.addEventListener("timeupdate", panzerlist_audio_timeupdate);
					audio.addEventListener("volumechange", panzerlist_audio_volumechange);
					$i++;
					$el=$('<a href="' + $this.children('source:first').attr('src') + '"'+(($i==1) ? ' class="active"' : '') + '>' + ((settings.auto_numbering) ? ($i+'. ') : '') + $this.attr('title') + '</a>').data('panzerlist', {
						audio  : audio,
						player : $player
					}).click(playlist_element_click);
					$('.list',$player).append($el);
					$this.after($player).data('panzerlist', {
						audio  : audio,
						player : $player,
						elem   : $el,
						loc    : $this.prev()
					});
					if (iOS) {
						$this.css({
							'position' : 'absolute',
							'top'      : -9999,
							'width'    : 0,
							'height'   : 0,
							'display'  : 'none',
							'visibility' : 'hidden',
							'overflow'   : 'hidden'
						});
					} else {
						$this.detach();
					}
				});
				if (settings.auto_start) $('.list a:first',$player).trigger('click');
			} else {
				additional_classes = " panzerlist-unsupported";
				if (settings.layout == "big") additional_classes += ' panzerlist-big';
				additional_classes += ' panzerlist-' + settings.theme;
				if (settings.expanded) additional_classes += ' panzerlist-expand';

				if (!settings.title || 0 === settings.title.length) {
					song_title = '';
				}
				else {
					song_title = '<div class="title">' + settings.title + '</div>';
				}
				if (settings.cover != '') {
					album_cover = '<div class="cover"><img src="'+settings.cover+'" alt="" /></div>';
					if (settings.show_list) additional_classes += ' hide-list';
				}
				else {
					album_cover = '';
				}

				$player = $('<div class="panzerlist' + additional_classes + '">' + song_title + album_cover + '<div class="list"></div><div class="player"><strong class="alert">' + settings.outdated_text + '</strong></div></div>');
				$i=0;
				this.each(function() {
					var $this = $(this);
					if (!$this.is('audio')) return; // check if we are dealing with an audio HTML tag
					if ($this.data('panzerlist')) return;
					$i++;
					$el=$('<a href="' + $this.children('source:first').attr('src') + '"' + '>' + $i + '. '+$this.attr('title') + '</a>').data('panzerlist', {
						player : $player
					});
					$('.list',$player).append($el);
					$this.after($player).data('panzerlist', {
						player : $player,
						elem   : $el,
						loc    : $this.prev()
					}).detach();
				});
			}
			return this;
		},
		destroy : function( ) {
			return this.each(function() {
				var $this = $(this), data = $this.data('panzerlist');
				if ( data ) {
					if (iOS) {
						$this.removeAttr("style");
					} else {
						if (data.loc) data.loc.after($this);
					}
					data.player.remove();
					$this.removeData('panzerlist').removeAttr('style');
					data = null;
				}
			})
		}
	};

	$.fn.panzerlist = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.panzerlist' );
		}
	};

})(jQuery);