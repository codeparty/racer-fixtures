// TODO Incorporate Store#fetchOrCreate (requires matching to query motifs)
var debug = require('debug')('fixtures')
  , inspect = require('util').inspect
  , deepEqual
  , Promise

module.exports = {
  fixture: fixture
, unique: unique
, loadFixtures: loadFixtures
};

function fixture (ns, alias, prop) {
  return {
    $fixture: true
  , ns: ns
  , alias: alias
  , prop: prop
  }
}
function unique (value) {
  return {
    $unique: true
  , value: value
  }
}

function loadFixtures (fixtures, store, cb) {
  Promise = store.racer.util.Promise;
  deepEqual = store.racer.util.deepEqual;

  var promisesByNs = {};

  for (var currNs in fixtures) {
    var docs = fixtures[currNs];
    promisesByNs[currNs] = promisesByNs[currNs] || {};
    for (var currAlias in docs) {
      var doc = docs[currAlias];
      promisesByNs[currNs][currAlias] = promisesByNs[currNs][currAlias] || new Promise;
      var deps = [];
      var ignore = ['id'];
      for (var property in doc) {
        var value = doc[property];
        if (value.$fixture) {
          ignore.push(property);
          deps.push({
            ns: value.ns
          , alias: value.alias
          , prop: value.prop
          , property: property
          });
        } else if (value.$unique) {
          ignore.push(property);
          value = value.value;
        }
      }
      if (deps.length) {
        var depPromises = {};
        for (var i = deps.length; i--; ) {
          var dep = deps[i]
          var ns = dep.ns
            , alias = dep.alias
            , property = dep.property
            , prop = dep.prop;
          promisesByNs[ns] = promisesByNs[ns] || {};
          var key = ns + '.' + alias + '.' + property + ':' + (prop || '');
          depPromises[key] = promisesByNs[ns][alias] = promisesByNs[ns][alias] || new Promise;
        }
        Promise.parallel(depPromises).on(
          promiseCallback(store, doc, currNs, currAlias, promisesByNs, ignore)
        );
      } else {
        createDoc(store, currNs, currAlias, doc, promisesByNs, ignore);
      }
    }
  }

  var allPromises = {};
  for (var ns in promisesByNs) {
    var proms = promisesByNs[ns];
    for (var alias in proms) {
      var promise = proms[alias];
      allPromises[ns + '.' + alias] = promise;
    }
  }

  var totalPromise = Promise.parallel(allPromises);
  totalPromise.on( function (err) { cb(err, !!err); });
}

function promiseCallback (store, doc, currNs, currAlias, promisesByNs, ignore) {
  return function (err, values) {
    for (var key in values) {
      var val = values[key];
      var pair = key.split(':')
        , joinedTriplet = pair[0]
        , _prop = pair[1]
        , triplet = joinedTriplet.split('.')
        , _ns = triplet[0]
        , _alias = triplet[1]
        , _property = triplet[2];
      doc[_property] = _prop ? val[_prop] : val;
    }
    createDoc(store, currNs, currAlias, doc, promisesByNs, ignore);
  };
}

function createDoc (store, ns, alias, doc, promisesByNs, ignore) {
  var k, v;
  for (k in doc) {
    v = doc[k];
    if (typeof v === 'function') doc[k] = v();
  }
  store.get(ns, function(err, coll) {
    for (k in coll) {
      if (deepEqual(doc, coll[k], ignore)) return;
    }
    store.add(ns, doc, function (err, id) {
      if (err) throw err;
      doc.id = id;
      debug('CREATED ' + ns + ' ' + alias + " \n" + inspect(doc, false, null));
      promisesByNs[ns][alias].resolve(err, doc);
    });
  });
}
