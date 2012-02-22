var tests = require('./test');

var evals = 0;
var test = {ok:function() { evals++; }, done:function(){}};
var then = Date.now();
var ITERATIONS = 50000;

for (var i = 0; i < ITERATIONS; i++) {
	for (var j in tests) {
		tests[j](test);
	}
}

var runtime = Date.now()-then;

console.log(Math.floor(1000*evals/runtime)+' evals/s - '+runtime+' ms');
