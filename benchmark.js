var tests = require('./test');

var test = {ok:function() {}, done:function(){}};
var then = Date.now();

for (var i = 0; i < 500000; i++) {
	for (var j in tests) {
		tests[j](test);
	}
}

console.log(Date.now()-then);
