
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');
var twitter = require('ntwitter');
var util = require('util');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use("/scripts", express.static(__dirname + '/scripts'));
app.use("/socket.io", express.static(__dirname + '/socket.io'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require('socket.io').listen(server);

var twit = new twitter({
    consumer_key: 'Q2r0BZLDHcdJOhAVe23Cg',
    consumer_secret: 'MELWxsBEtQOwWHKRhp5r0GfYlL08fvKIKmOrjKixo',
    access_token_key: '18574936-RaQiBkL4DSQxXNhTROpbucj6jWrrmwA44KqpIjz9H',
    access_token_secret: 'K7N2vKeVVptU8q5k4utJPheSliX7tc6YfgMusGpQeO3Nd'
});


var profanity = ['fuck', 'shit', ' ass ', ' sex ', 'asshole', 'jackass', 'bitch', 'dick', 'douche', 'dick', 'suck', 'boner', 'skank', 'nuts', 'cock', 'jackhole', 'boobs', 'pecker', 'wanker', 'bloody', 'cunt', ' cum ', 'spunk', 'fag', 'funbags', 'melons', 'cans', 'jugs', 'jizz', 'pussy', 'sex', 'tits', 'boobs', 'aids', 'retard', 'penis', 'vagina', 'whore', 'slut'];
var profanity2 = ['fuck me', 'fuck him', ' ass ', ' sex ', ' dick', 'cock ', 'boobs', 'funbags', 'melons', 'cans', 'jugs', 'jizz', 'pussy', 'sex', ' tits', 'boobs', ' penis', 'vagina', ' slut'];

var currentList = [];
currentList = profanity;

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('keywords', function (data) {
        currentList = data;       
    });
});

function memberOf(arr, str) {
    for (var i = 0; i < arr.length; i++) {
        if (str.indexOf(arr[i]) >= 0) {
            return true;
        } else {
            return false;
        }
    }   
}

twit.stream('statuses/filter', 
    { 'locations': '-124,23,-66,48' },  //usa
    //{ 'locations': '-74,40,-73,41' }, //nyc
    //{ 'locations': '-88.13919067382812, 42.99410122501033, -87.86453247070312, 43.14458518880386' }, //mke
    //{ 'track': 'something' },  //filter
        
    function (stream) {
        stream.on('data', function (data) {
            if (data.coordinates && memberOf(currentList, data.text)) {
                io.sockets.emit('twitter', data);
                console.log(data.text);
            }
        });
        stream.on('end', function (data) {
            console.log('stream ended');
        });
        stream.on('destroy', function (data) {
            console.log('stream destroyed');
        });
});
