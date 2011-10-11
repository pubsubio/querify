var AND = 1;
var OR  = 2;

var isRegex = function(regex) {
	return Object.prototype.toString.call(regex) === '[object RegExp]';
};
var reduce = function(op, list) { // this method is verbose and built for speed
	if (list.length === 1) { // single item track
		return list[0];
	}
	if (list.length === 2) { // fast op track
		var a = list[0];
		var b = list[1];

		return op === AND ?
			function(doc) {
				return a(doc) && b(doc);
			} :
			function(doc) {
				return a(doc) || b(doc);
			};
	}
	return op === AND ?  // list iteration track
		function(doc) {
			for (var i = 0; i < list.length; i++) {
				if (!list[i](doc)) {
					return false;
				}
			}
			return true;
		} :
		function(doc) {
			for (var i = 0; i < list.length; i++) {
				if (list[i](doc)) {
					return true;
				}
			}
			return false;			
		};
};
var mapReduce = function(op, list, fn) {
	if (!Array.isArray(list)) {
		return fn(list);
	}
	for (var i = 0; i < list.length; i++) {
		list[i] = fn(list[i]);
	}	
	return reduce(op, list);
};

// the outer language: doc:{$op:value}
var outer = {
	$has: function(keys) {
		return mapReduce(AND, keys, function(key) {
			return function(doc) {
				return key in doc;
			};
		});
	},
	$or: function(paths) {
		return mapReduce(OR, paths, compile);
	}
};

// the inner language: doc:{key:{$op:value}}
var inner = {
	$not: function(key, val) {
		if (isRegex(val)) {
			var fn = inner.$regex(key, val);
			
			return function(doc) {
				return !fn(doc);
			};
		}
		return function(doc) {
			return doc[key] !== val;
		};
	},
	$exists: function(key, val) {
		return function(doc) {
			return (key in doc) === val;
		};
	},
	$nil: function(key, val) {
		return function(doc) {
			return (doc[key] === undefined || doc[key] === null) === val;
		};
	},
	$any: function(key, vals) {
		return mapReduce(OR, vals, function(val) {
			return function(doc) {
				return doc[key] === val;
			};
		});
	},
	$like: function(key, vals) {
		return mapReduce(AND, vals, function(val) {
			val = val.toLowerCase();

			return function(doc) {
				return typeof doc[key] === 'string' && doc[key].toLowerCase().indexOf(val) > -1;				
			};
		});
	},
	$regex: function(key, regex) { // normalized syntax for regex queries
		if (typeof regex === 'string') {
			var index = regex.lastIndexOf('/');
			var modifiers = regex.substring(index+1);

			regex = new RegExp(regex.substring(1,index), modifiers);
		}
		return function(doc) {
			return doc[key] !== undefined && doc[key] !== null && regex.test(doc[key]);
		};
	},
	// classic number operators
	$gt: function(key, val) {
		return function(doc) {
			return doc[key] > val;
		};
	},
	$gte: function(key, val) {
		return function(doc) {
			return doc[key] >= val;
		};
	},
	$lt: function(key, val) {
		return function(doc) {
			return doc[key] < val;
		};
	},
	$lte: function(key, val) {
		return function(doc) {
			return doc[key] <= val;
		};
	},
	$mod: function(key, val) {
		return function(doc) {
			return doc[key] % val[0] === val[1];
		};
	}
};

var not = function(definition) {
	return function(a,b) {
		var fn = definition(a,b);

		return function(doc) {
			return !fn(doc);
		};
	};
};

// lets add all the "$not"s
[inner, outer].forEach(function(col) {
	for (var i in col) {
		col['$not'+i.substring(1)] = not(col[i]);
	}	
});

exports.define = function(name, definition) {
	if (typeof name === 'object') {
		for (var i in name) {
			exports.define(i, name[i]);
		}
		return;
	}
	inner[name] = definition;
	inner['$not'+name.substring(1)] = not(definition);
};

var compile = function(query) {
	var subset = {};
	var list = [];
	
	query = query || {};

	list.push(function(doc) {
		for (var i in subset) {
			if (subset[i] !== doc[i]) {
				return false;
			}
		}
		return true;
	});
	
	for (var i in query) {
		var val = query[i];

		if (isRegex(val)) { // shorthand for regex
			list.push(inner.$regex(i, val));
			continue;
		}
		if (outer[i]) {
			list.push(outer[i](val));
			continue;
		}
		if (typeof val === 'object') {
			for (var j in val) {
				if (inner[j]) {
					list.push(inner[j](i, val[j]));
				}
			}
			continue;
		}
		if (i.charAt(0) !== '$') {
			subset[i] = val;			
		}
	}

	return reduce(AND, list);
};

exports.compile = compile;
exports.normalize = function(query) {
	for (var i in query) {
		if (isRegex(query[i])) {
			query[i] = {$regex:query[i].toString()};
		}
	}
	return query;
};
exports.filter = function() {
	var select = function(obj, sel) {
		if (!sel) {
			return obj;
		}
		var res = {};
		
		for (var i in sel) {
			if (sel[i]) {
				res[i] = obj[i];
			}
		}
		return res;
	};

	return function(array, options) {
		var result = [];
		var query = compile(options.query);
		
		if (typeof options.sortBy === 'string') {
			var sort = {};
			
			sort[options.sortBy] = 1;
			options.sortBy = sort;		
		}
		if (options.sortBy) {
			array = array.sort(function(a,b) {
				for (var i in options.sortBy) {
					if (a[i] === b[i]) {
						return 0;
					}
					return options.sortBy[i] * (a[i] > b[i] ? 1 : -1);
				}
			});
		}
		
		for (var i = 0; i < array.length; i++) {
			if (query(array[i])) {
				result.push(select(array[i], options.select));			
			}
		}
	
		return result;
	}
}();