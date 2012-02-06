(function($) {
	
	var FEED_URL = 'http://feeds.feedburner.com/PennOlson';
	var AUTHOR_URL = 'http://www.penn-olson.com/author/';
	var CURSOR = 0;
	var ENTRIES = [];
	var LOG = false;
	
	$(document).ready(function() {	
		log('jQuery DOM has been built..');
		
		// Full content popups
		$('.entry > .title > a').live('click', function(evt) {
			evt.preventDefault();
			var eid = $(this).attr('data-eid');
			if (eid) {
				var id = 'modal-' + eid;
				if (!$('#' + id).length) {
					var modal = '';
					modal += '<div class="modal" id="' + id + '">';
					modal += '<div class="modal-header"><a href="javascript://" class="close" data-dismiss="modal">x</a>';
					modal += '<h3>' + ENTRIES[eid].title + '</h3></div>';
					modal += '<div class="modal-body box">' + ENTRIES[eid].content + '</div>';
					modal += '<div class="modal-footer">' + '<a class="btn btn-primary twitter-share-button" href="http://twitter.com/intent/tweet?text=' + encodeURIComponent(ENTRIES[eid].title + ' ' + ENTRIES[eid].link) + '&related=pennolsen,amarnus">Share on Twitter</a>'  + '</div>';
					modal += '</div>';
					$('body').append(modal);
					$('#' + id).modal({ backdrop: true, keyboard: true });
				} 
				$('#' + id).modal('show');
			}	
		});
		
		// Load more button
		$('footer > button').button();
		$('footer > button').click(function(evt) {
			$(this).button('loading');
			fetchFeedItems(FEED_URL, CURSOR, 20, hasFeedItemsLoaded);
		});
	});
	
	// Load the Google Feed API asynchronously
	google.load("feeds", 1);
	// On load
	google.setOnLoadCallback(hasGoogleFeedAPILoaded);
	
	/**
	 * Delegate that runs once the Google Feed API was fetched asynchronously
	 */
	function hasGoogleFeedAPILoaded(evt) {
		log('Google Feed API has loaded..');
		$('footer > button').button('loading');
		var items = fetchFeedItems(FEED_URL, CURSOR, 20, hasFeedItemsLoaded);
	}
	
	/**
	 * Delegate that runs when feed items have been fetched
	 */
	function hasFeedItemsLoaded(result) {
		if (typeof(result) === 'boolean' && !result) {
			log("Feed items from the url " + FEED_URL + " could not be fetched\n");
			$('footer > button').button('reset');
			// Print the error message
			return false;
		}
		
		CURSOR += result.length;
		log(result.length + ' feed items have been fetched from ' + FEED_URL + '\n');
		
		out = '';
		for(var i = 1; i <= result.length; i++) {
			firstRow = (i == 1);
			newRow = (i % 4 == 1);
			if (newRow && !firstRow) {
				out += '</div>\n<div class="row-fluid">';
			}
			else if (newRow) {
				out += '<div class="row-fluid">';
			}
			out += '<div class="span3">';
			out += themeFeedEntry(result[i - 1]);
			out += '</div>';
		}
		$('body > .container-fluid > section').append(out);
		$('footer > button').button('reset');
	}
	
	/**
	 * Checks if the console exists before logging.
	 */
	function log(message) {
		if (console && LOG) {
			console.log(message);
		}
	}
	
	/**
	 * Extends the Date API and checks if the given date is today's date
	 */
	Date.prototype.isToday = function() {
		var now = new Date();
		var me = this;
		return  (now.getDate() == me.getDate()) && (me.getMonth() == now.getMonth()) && (me.getYear() == now.getYear());
	}
	
	/**
	 * Themes a given feed entry
	 *
	 * @param object entry
	 *   The Feed entry object
	 * @return
	 *   Entry in the form of themed HTML
	 */
	function themeFeedEntry(entry) {
		classes = [ 'entry', 'well' ];
		if (new Date(entry.publishedDate).isToday()) {
			classes.push('today');
		}
		output = '<div class="' + classes.join(' ') + '">';
		output += '<h2 class="title"><a href="' + entry.link + '" data-eid="' + entry.eid + '" rel="external"  target="_blank">' + entry.title + '</a></h2>';
		output += '<h2><small>' + entry.author + '</small></h2>';
		output += '<p><small>' + entry.publishedDate + '</small></p>';
		output += '<p>' + entry.contentSnippet + '</p>';
		output += '<p><small>Tagged under ' + entry.categories.join(', ') + '</small></p>';
		output += '<div class="actions"><a class="btn twitter-share-button" href="http://twitter.com/intent/tweet?text=' + encodeURIComponent(entry.title + ' ' + entry.link) + '&related=pennolsen,amarnus">Share on Twitter</a></div>';
		output += '</div>';
		return output;
	}
	
	/**
	 * Gets a given number of items from a given feed URL optionally starting from a given cursor
	 * 
	 * @param string url
	 *   URL of the feed source
	 * @param number from
	 *   Index of the first item to retrieve from (Defaults to 0)
	 * @param number count
	 *   Number of items to fetch (Defaults to 20)
	 * @param function callback
	 *   Callback to call when the required feed items have been fetched
	 */
	function fetchFeedItems(url, from, count, callback) {
		from = from || 0;
		count = count || 20;
		
		var feed = new google.feeds.Feed(FEED_URL);
		feed.setResultFormat(google.feeds.Feed.JSON_FORMAT);
		feed.setNumEntries(from + count);
		feed.includeHistoricalEntries();
		log('From ' + from + ' to ' + (from + count) + '\n');
		feed.load(function(result) {
			if (result.error) {
				ret = false;
			}
			else {
				// Set title
				header = '<a href="' + result.feed.link + '" rel="external" target="_blank"><h1>' + result.feed.title + '</h1></a>';
			    header += '<h2><small>' + result.feed.description + '</small></h2>';
			    header += '<hr class="soften">'; 
			    $('body > div.container-fluid > .title-wrapper').html(header);
				
				var max = (count > result['feed'].entries.length) ? count : result['feed'].entries.length;
				items = [];
				for (var i = from; i < max; i++) {
					item = result['feed'].entries[i];
					item.eid = i;
					ENTRIES[i] = item;
					items.push(item);
				}
				ret = items;	
			}	
			
			if (callback && $.isFunction(callback)) {
				callback(ret);
			}
		});
	}
	
	
})(jQuery);