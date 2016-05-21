'use strict;'
var esprima = require('esprima');
var mocha = require('mocha');
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');

describe('make.js', function() {
	describe('Syntax', function () {
		it('Should be valid Javascript', function() {
			try {
				var userStringToTest = fs.readFileSync(path.resolve('make.js'));
				esprima.parse(userStringToTest);
				assert(true);
			}
			catch(e) {
				console.error(e);
				assert(false, JSON.stringify(e, null, 2));
			}
		});
		it('Should be valid node', function(){
			try {
				var app = require('../make');
				assert(true);
			}
			catch(e) {
				console.error(e);
				assert(false, JSON.stringify(e, null, 2));
			}
		});
	});
});