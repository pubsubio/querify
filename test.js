var querify = require('./index');

exports.define = function(test) {
	querify.define({$meh: function(key, val) {
		return function(doc) {
			return doc[key] === 'meh';
		};
	}});

	var query = querify.compile({a:{$meh:1}});

	test.ok(query({a:'meh'}));
	test.ok(query({a:'meh', b:1}));
	test.ok(!query({a:1}));
	test.ok(!query({}));
	test.done();
};

exports.empty = function(test) {
	var all = querify.compile({});

	test.ok(all({}));
	test.ok(all({a:1}));
	test.ok(all({b:'a'}));
	test.done();
};

exports.undef = function(test) {
	var all = querify.compile();

	test.ok(all({}));
	test.ok(all({a:1}));
	test.ok(all({b:'a'}));
	test.done();
};


exports.subset = function(test) {
	var query = querify.compile({a:1});

	test.ok(query({a:1}));
	test.ok(query({a:1, b:1}));
	test.ok(!query({a:2}));
	test.ok(!query({b:1}));
	test.done();
};

exports.subset2 = function(test) {
	var query = querify.compile({a:1, b:1});

	test.ok(query({a:1, b:1}));
	test.ok(query({a:1, b:1, c:1}));
	test.ok(!query({a:1}));
	test.ok(!query({b:1}));
	test.done();
};

exports.regex = function(test) {
	var query = querify.compile({a:/ok/i});

	test.ok(query({a:'ok'}));
	test.ok(query({a:'ja ok'}));
	test.ok(query({a:'OK'}));
	test.ok(!query({a:'meh'}));
	test.ok(!query({}));
	test.done();
};

exports.any = function(test) {
	var query = querify.compile({a:{$any:['a','b']}});

	test.ok(query({a:'a'}));
	test.ok(query({a:'b'}));
	test.ok(!query({a:'c'}));
	test.ok(!query({a:'d'}));
	test.ok(!query({}));
	test.done();
};

exports.or = function(test) {
	var query = querify.compile({$or:[{a:1}, {b:1}]});

	test.ok(query({a:1}));
	test.ok(query({b:1}));
	test.ok(query({a:1,b:1}));
	test.ok(query({a:2,b:1}));
	test.ok(!query({a:2}));
	test.done();
};

exports.gt = function(test) {
	var query = querify.compile({a:{$gt:1}, b:{$gte:1}});

	test.ok(query({a:2, b:1}));
	test.ok(query({a:3, b:3}));
	test.ok(query({a:5, b:1}));
	test.ok(!query({a:0, b:0}));
	test.ok(!query({a:2, b:0}));
	test.ok(!query({a:0, b:1}));
	test.ok(!query({}));
	test.done();
};

exports.lt = function(test) {
	var query = querify.compile({a:{$lt:4}, b:{$lte:4}});

	test.ok(query({a:2, b:1}));
	test.ok(query({a:3, b:3}));
	test.ok(query({a:3, b:4}));
	test.ok(!query({a:4, b:5}));
	test.ok(!query({a:4, b:0}));
	test.ok(!query({a:0, b:5}));
	test.ok(!query({}));
	test.done();
};

exports.mod = function(test) {
	var query = querify.compile({a:{$mod:[2,0]}});

	test.ok(query({a:2}));
	test.ok(query({a:0}));
	test.ok(query({a:42242}));
	test.ok(!query({a:1}));
	test.ok(!query({a:42531}));
	test.done();
};

exports.not = function(test) {
	var query = querify.compile({a:{$notmod:[2,0]}});

	test.ok(!query({a:2}));
	test.ok(!query({a:0}));
	test.ok(!query({a:42242}));
	test.ok(query({a:1}));
	test.ok(query({a:42531}));
	test.done();	
};

exports.not2 = function(test) {
	querify.define({$meh: function(key, val) {
		return function(doc) {
			return doc[key] === 'meh';
		};
	}});

	var query = querify.compile({a:{$notmeh:1}});

	test.ok(!query({a:'meh'}));
	test.ok(!query({a:'meh', b:1}));
	test.ok(query({a:1}));
	test.ok(query({}));
	test.done();
};

exports.exists = function(test) {
	var query = querify.compile({a:{$exists:true}});

	test.ok(query({a:1}));
	test.ok(query({a:'yay'}));
	test.ok(!query({}));
	test.ok(!query({b:1}));
	test.done();
};

exports.nil = function(test) {
	var query = querify.compile({a:{$nil:true}});

	test.ok(query({}));
	test.ok(query({a:undefined}));
	test.ok(query({a:null}));
	test.ok(!query({a:false}));
	test.ok(!query({a:0}));
	test.ok(!query({a:'yay'}));
	test.done();
};

exports.like = function(test) {
	var query = querify.compile({a:{$like:'meh'}});

	test.ok(query({a:'meh'}));
	test.ok(query({a:'jameh'}));
	test.ok(query({a:'meheh'}));
	test.ok(query({a:'MEH'}));
	test.ok(query({a:'JAMEH'}));
	test.ok(query({a:'MEHEH'}));
	test.ok(!query({a:1}));
	test.ok(!query({a:'lol'}));
	test.ok(!query({}));
	test.done();
};

exports.normalize = function(test) {
	var query = {a:/a/};
	var normalized = querify.normalize(query);

	test.ok(/a/.toString() === normalized.a.$regex);
	test.done();
};