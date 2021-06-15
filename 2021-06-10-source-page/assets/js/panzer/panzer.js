/* 
 * Panzer HTML5 Audio Player
 * Version: 1.0
 * Author: http://codecanyon.net/user/liviu_cerchez
 */

(function($) {
	var deviceAgent = navigator.userAgent.toLowerCase();
	var iOS = deviceAgent.match(/(iphone|ipod|ipad)/);

	var methods = {
		init : function(options) {
			return this.each(function() {
				var $this = $(this);
				if (!$this.is('audio')) return; // check if we are dealing with an audio HTML tag

				var settings = $.extend({
					layout       : 'mini', // sets the layout style: mini, big
					theme        : 'dark', // sets the theme: dark, light, custom
					expanded     : false,  // wheater to expand the player at layout full width
					cover        : '',     // album cover
					pauseothers  : true,   // determines if the player should pause when other panzer player is played
					showduration : false,  // determines if the player should contain a duration text 
					showvolume   : false,  // determines if the player should contain a duration text 
					volume       : 100,    // initial volume of the audio player
					title        : ''      // set a song title to be displayed below the player
				}, options);
				if (settings.volume < 0 ) settings.volume = 0;
				if (settings.volume >100 ) settings.volume = 100;
				var $this = $(this), audio = $this.get(0), data = $this.data('panzer');
				if ( ! data ) {
					var additional_classes = '';
					if (settings.layout == "big") additional_classes = ' panzer-big';
					if (settings.theme == "light")
						additional_classes += ' panzer-light';
					else if (settings.theme == "dark")
						additional_classes += ' panzer-dark';
					else
						additional_classes += ' panzer-custom';
					if (settings.expanded) additional_classes += ' panzer-expand';
					if (settings.pauseothers) additional_classes += ' pause-others';
					if (!!this.canPlayType) {
						controls = '<div class="controls"><span class="play"><em></em></span></div><div class="progress-wrapper"><div class="progress"><div class="elapsed" style="width:0;display:none"></div></div></div>';
						if (settings.showduration) {
							var m, s;
							m = Math.floor( audio.duration / 60 );
							m = isNaN( m ) ? '00' : ( m >= 10 ) ? m : '0' + m;
							s = Math.floor( audio.duration % 60 );
							s = isNaN( s ) ? '00' : ( s >= 10 ) ? s : '0' + s;
							if (m>100) {
								controls += '<span class="duration small">'+m+':'+s+'</span>';
							} else {
								controls += '<span class="duration">'+m+':'+s+'</span>';
							}
							additional_classes += ' show-duration';
						}
						if (settings.showvolume) {
							controls += '<div class="volume-wrapper"><span></span><div class="volume"><div class="set" style="width:'+settings.volume+'%"></div></div></div>';
							additional_classes += ' show-volume';
						}
					} else {
						var src = $this.attr('src');
						if (typeof src === 'undefined') src = $this.children('source:first').attr('src');
						if (typeof src === 'undefined') {
							controls = '<strong class="alert">Please specify an audio source file.</strong>';
							additional_classes += ' panzer-unsupported';
						}
						else {
							controls = '<div class="controls"><a class="download" href="'+src+'" title="Download File"><em></em></a></div><strong class="alert">Download Audio</strong>';
							additional_classes += ' panzer-download';
						}
					}
					if (settings.cover != '') {
						album_cover = '<div class="cover"><img src="'+settings.cover+'" alt="" /></div>';
					}
					else {
						album_cover = '';
					}
					if (!settings.title || 0 === settings.title.length) {
						song_title = ($this.attr('title')) ?  '<div class="title">' + $this.attr('title') + '</div>' : '';
					}
					else {
						song_title = '<div class="title">'+settings.title+'</div>';
					}
					$player = $('<div class="panzer' + additional_classes + '">' + album_cover + '<div class="player">' + controls + '</div>' + song_title + '</div>');
					$this.after($player).data('panzer', {
						target : $this,
						audio  : audio,
						player : $player,
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
					$player.data('panzer', {
						audio  : audio
					});
					if (!!this.canPlayType) {
						$('.play',$player).click(function(e) {
							if ($(this).hasClass('play')) {
								$('.panzer.pause-others').each(function(){
									var data = $(this).data('panzer');
									if ( data && !data.audio.paused ) data.audio.pause();
								});
								$('.panzerlist.pause-others').each(function(){
									var data = $(this).find('a.active').data('panzerlist');
									if ( data && !data.audio.paused ) data.audio.pause();
								});
							}
							data = $(this).parents('.panzer').data('panzer');
							if ( data.audio.paused ) {
								data.audio.play();
							} else {
								data.audio.pause();
							}
						});
						audio.addEventListener("play", function() {
							data = $(this).data('panzer');
							$('.play',data.player).toggleClass('play pause');
						});
						audio.addEventListener("pause", function() {
							data = $(this).data('panzer');
							$('.pause',data.$player).toggleClass('play pause');
						});
						audio.addEventListener("ended", function() {
							data = $(this).data('panzer');
							data.audio.pause();
						});
						audio.addEventListener("timeupdate", function() {
							data = $(this).data('panzer');
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
						});
						if (settings.showvolume) {
							audio.addEventListener("volumechange", function() {
								data = $(this).data('panzer');
								var percent = data.audio.volume * 100;
								if (percent == 0)
									$('.volume .set',data.player).hide().css('width',0);
								else
									$('.volume .set',data.player).show().css('width', percent+'%');
							});
							audio.volume = settings.volume / 100;
							var leftButtonDown = false;
							$('.volume',$player).mousedown(function(e){
								if(e.which === 1) {
									leftButtonDown = true;
									changeVolume($(this),e);
								}
							}).mouseup(function(e){
								if(e.which === 1) leftButtonDown = false;
							}).mousemove(function(e){
								if (e.which = 1 && leftButtonDown) {
									changeVolume($(this),e);
								}
							});
							function changeVolume($this,e) {
								var offset = $this.offset();
								var x = e.pageX - offset.left;
								var percent = 100 * x / ($this.width()+1);
								if (percent < 0) percent = 0;
								if (percent > 100) percent = 100;
								data = $this.parents('.panzer').data('panzer');
								data.audio.volume = percent / 100;
							}
						}
						$('.progress').click(function(e){
							var offset = $(this).offset();
							var x = e.pageX - offset.left;
							var percent = 100 * x / ($(this).width()+1);
							if (percent < 0) percent = 0;
							if (percent > 100) percent = 100;
							data = $(this).parents('.panzer').data('panzer');
							var time = Math.round(data.audio.duration / 100 * percent);
							if ( data.audio.readyState === 0 ) {
								data.audio.addEventListener('canplay', function() {
									data = $(this).data('panzer');
									data.audio.currentTime = time;
								});
							} else {
								data.audio.currentTime = time;
							}
						});
					}
				}
			});
		},
		destroy : function( ) {
			return this.each(function() {
				var $this = $(this), data = $this.data('panzer');
				if ( data ) {
					if (iOS) {
						$this.removeAttr("style");
					} else {
						if (data.loc) data.loc.after($this);
					}
					data.player.remove();
					$this.removeData('panzer').removeAttr('style');
				}
			})
		}
	};

	$.fn.panzer = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.panzer' );
		}
	};

})(jQuery);