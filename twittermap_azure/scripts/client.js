
//twitter widget
!function (d, s, id)
{ var js, fjs = d.getElementsByTagName(s)[0]; if (!d.getElementById(id))
    { js = d.createElement(s); js.id = id; js.src = "//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs); } }(document, "script", "twitter-wjs");

//GA
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54332320-1', 'auto');
ga('send', 'pageview');




TwitMap = (function () {
    
    var utils = {
        formatCreateDate: function (dstamp) {
            var createdAt = moment(dstamp);
            var now = moment(new Date());
            var ago = now.diff(createdAt, 'seconds');
            if (ago < 10) {
                return "a few seconds ago.";
            } else if (ago < 60) {
                return ago + " seconds ago.";
            } else if (ago < 3600) {
                return ago / 60 + " minutes ago.";
            } else if (ago < 86400) {
                return ago / 3600 + " hours ago.";
            } else if (ago < 31536000) {
                return ago / 3600 / 24 + " days ago.";
            } else {
                return "over a year ago.";
            }
        },
        parseLinks: function (str) {
            return str.replace(/(https?:\/\/[^\s]+)/g, function (url) {
                return '<a target="_blank" href="' + url + '">' + url + '</a>';
            });
        }
    };

    var app = function (opts) {
        this.mapOptions = opts.googleMapOptions;
        this.socketIoHost = opts.socketIoHost;
        this.tweetTemplate = Handlebars.compile(opts.handlebarsMarkerTemplate);
        this.maxInfoWindows = opts.maxInfoWindows || 20;
        this.interval = opts.interval || 5000;
        this.localhostCheck();
        this.socket = null;
        this.tweets = [];
        this.infoWindows = [];
        this.map = {};
        this.intervalHandle = null;
        var me = this;
        this.totalTweets = 0;
        google.maps.event.addDomListener(
                window, 
                'load', 
                function () {
                    me.map = new google.maps.Map(document.getElementById("map-canvas"), me.mapOptions);
                    me.map.panTo(coords = new google.maps.LatLng(43.009946, -88.237436));
                }
        );
    };
    
    app.prototype.localhostCheck = function () {
        if (document.location.hostname != "localhost") {
            $('#localhost_window').hide();
            $('.debug').hide();
        } else {
            
            this.socketIoHost = 'http://localhost:1337';
        }
    };
    
    app.prototype.start = function () {
        this.socket = io.connect(this.socketIoHost);
        var me = this;        
        this.socket.on('twitter', this.addTweet.bind(this));
        this.socket.on('keywords_changed', this.keywordsChanged.bind(this));
        this.intervalHandle = setInterval(this.showNext.bind(this), this.interval);
        $('#btn_add_keywords').click(this.addKeywords.bind(this));
        $('#keywords').tagsInput({});
        this.addKeywords();
    };
    
    app.prototype.addKeywords = function () {
        this.socket.emit('keywords', $('#keywords').val().split(','));
    };
    
    app.prototype.keywordsChanged = function (keywords) {
        $('#keywords').importTags('');
        $('#keywords').importTags(keywords);
        this.tweets = [];
        this.totalTweets = 0;
        for (var i = 0; i < this.infoWindows.length; i++) {
            this.infoWindows[i].close();
        }
    };
    
    app.prototype.addTweet = function (tweet) {        
        if (this.tweets.length < 50) {
            if (tweet.entities && tweet.entities.media && tweet.entities.media.length > 0) {
                tweet.media_url = tweet.entities.media[0].media_url;
            }
            tweet.created_at_str = TwitMap.utils.formatCreateDate(tweet.create_date);
            tweet.text_parsed = TwitMap.utils.parseLinks(tweet.text);
            this.tweets.push(tweet);
            this.totalTweets++;
            $('.debug').html(this.totalTweets + " total, " + this.tweets.length + " in the queue, " + this.infoWindows.length + " infowindows");
            $('.count').html(this.totalTweets + ' found');
        }
    };
    app.prototype.showNext = function () {
        if (this.tweets.length > 0) {
            this.placeInfoWindow(this.tweets[0]);
            //once the tweet is displayed we can remove it from the queue
            if (this.tweets.length > 0) {
                this.tweets = this.tweets.splice(1, this.tweets.length - 1);
            }
        }
    };
    
    app.prototype.placeInfoWindow = function (tweet) {
        var coords = null;
        coords = new google.maps.LatLng(tweet.coordinates.coordinates[1], tweet.coordinates.coordinates[0]);
        var iwOpts = {
            content: this.tweetTemplate(tweet),
            disableAutoPan: true,
            position: coords
        };
        var iw = new google.maps.InfoWindow(iwOpts);
        iw.open(this.map);
        twttr.widgets.load()
        
        this.map.panTo(coords);
        this.infoWindows.push(iw);

        if (this.infoWindows.length > this.maxInfoWindows) {
            this.infoWindows[0].close();
            this.infoWindows = this.infoWindows.splice(1, this.infoWindows.length-1);
        }
    };
    
    return {
        app : app,
        utils: utils
    };

})();

$(function () {
    
    var gmapStyle = [{ "featureType": "water", "stylers": [{ "color": "#021019" }] },{ "featureType": "landscape", "stylers": [{ "color": "#08304b" }] },{ "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#0c4152" },{ "lightness": 5 }] },{ "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },{ "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#0b434f" },{ "lightness": 25 }] },{ "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },{ "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#0b3d51" },{ "lightness": 16 }] },{ "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },{ "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },{ "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" },{ "lightness": 13 }] },{ "featureType": "transit", "stylers": [{ "color": "#146474" }] },{ "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },{ "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#144b53" },{ "lightness": 14 },{ "weight": 1.4 }] }];

    var newApp = new TwitMap.app( {
        handlebarsMarkerTemplate: $("#tweet-marker").html(),
        socketIoHost: 'http://twittermap.azurewebsites.net/',
        googleMapOptions: {
            center: new google.maps.LatLng(-74.04441833496094, 40.70172388214517),
            zoom: 6,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: gmapStyle
        },
        interval: 7000,
        maxInfoWindows: 8
    });
    newApp.start();

    
});