var Promise = require('./promise');
var HTTP = require('http');
var URL = require('url');

function visit_nytimes_page(url) {
	var p = new Promise.Promise();
	var options = URL.parse(url);
	if (!options["headers"]) {
		options["headers"] = {};
	}
	options["headers"]["Referer"] = "https://www.google.com/";
	var req = HTTP.request(options, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			p.done(null, res.headers);
		});
		res.on('error', function(error){
			throw new "HTTP data error"
		});
	});
	req.end();
	return p;
}
function psuedo_login_req(res_headers) {
	var p = new Promise.Promise();
	var url = res_headers["location"];
	var RMID_cookie = res_headers["set-cookie"][0].match(/RMID.*?;/)[0]
	var options = URL.parse(url);
	if (!options["headers"]) {
		options["headers"] = {};
	}
	options["headers"]["Cookie"] = RMID_cookie;
	var req = HTTP.request(options, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			p.done(null, res.headers);
		});
		res.on('error', function(error){
			throw new "HTTP data error"
		});
	});
	req.end();
	return p;
}
function extract_secret_cookie (res_headers) {
	var NYT_S_cookie = res_headers["set-cookie"][0].match(/NYT-S.*?;/)[0];
	return NYT_S_cookie;
}
function secret_cookie_gen(url) {
	var p = new Promise.Promise();
	visit_nytimes_page(url)
	.then(function(err, data){
		return psuedo_login_req(data);
	})
	.then(function(err, data){
		var cookie = extract_secret_cookie(data);
		p.done(null, cookie);
	})
	return p;
}
module.exports.generator = secret_cookie_gen;