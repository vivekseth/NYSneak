var express = require('express');

var HTTP = require('http');
var URL = require('url');

var Promise = require('./promise');
var cookie_gen = require('./cookie_gen');

var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/public'));
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

var reuse_count = 100;
var cookie_store = {
	"cookie" : false,
	"times" : 0
}

var script_inject = '<script>jQuery("#pageLinks a").each(function(a, b){b.href = "/sneak?url=" + "http://www.nytimes.com" + b.attributes.href.textContent})</script>'

app.get('/sneak', function(user_req, user_res){
	var url = user_req['query']['url'];
	if (!url) {
		user_res.send('no url');
	}
	else if (url.match(/^\//)) {
		url = "http://www.nytimes.com" + url;
	}
	else if (url.match(/^http:\/\/www\.nytimes\.com/)) {
		var cookie = "";
		if (cookie_store["cookie"] && cookie_store["times"] < reuse_count) {
			cookie = cookie_store["cookie"];
			cookie_store["times"]++;
			render_page(url, cookie, user_res);
		} else {
			cookie_gen.generator(url)
			.then(function(err, data){
				cookie = data;
				cookie_store["cookie"] = cookie;
				cookie_store["times"] = 0;
				render_page(url, cookie, user_res);
			})
		}
	} else {
		user_res.send('invalid nytimes page');
	}
});

function render_page(url, cookie, user_res) {
	var options = URL.parse(url);
	options['headers'] = {};
	options['headers']['Cookie'] = cookie;
	HTTP.request(options, function(res){
		var first = true;
		res.on('data', function(chunk){
			if (first) {
				user_res.setHeader('content-type', 'text/html');
				first = false;
			}
			user_res.write(chunk);
		});
		res.on('end', function() {
			user_res.write(script_inject);
			user_res.end();
		});
		res.on('error', function(){
			user_res.send('There was an error processing your request');			
		})
	}).end();
}


