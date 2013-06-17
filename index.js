// TODO Incorporate Store#fetchOrCreate (requires matching to query motifs)
var debug = require('debug')('fixtures')
  , inspect = require('util').inspect
  , objectUtils = require('racer-util/object')
  , deepEqual = objectUtils.deepEqual
  , assign = objectUtils.assign
  , Promise = require('./Promise')
  ;

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

function loadFixtures (fixtures, store, cb, altNsTargets) {
  var model = store.createModel();

  var promisesByNs = {};

  var collectionPromises = {};

  for (var currNs in fixtures) {
    var docs = fixtures[currNs];
    promisesByNs[currNs] = promisesByNs[currNs] || {};
    for (var currAlias in docs) {
      var doc = docs[currAlias];
      promisesByNs[currNs][currAlias] = promisesByNs[currNs][currAlias] || new Promise;
      var deps = [];
      var ignore = ['id'];
      parseDoc(doc, {
        onFixture: function (path, ns, alias, prop) {
          ignore.push(path);
          deps.push({
            ns: ns
          , alias: alias
          , prop: prop
          , property: path
          });
        }
      , onIgnore: function (property, value) {
          ignore.push(property);
          value = value.value;
        }
      });

      var collPromise = collectionPromises[currNs] = new Promise;
      if (altNsTargets && altNsTargets[currNs]) {
        altNsTargets[currNs](model, collPromise.resolve.bind(collPromise));
      } else {
        model.fetch(currNs, (function (currNs, collPromise) {
          return function (err) {
            if (err) return collPromise.resolve(err);
            collPromise.resolve(null, model.get(currNs));
          };
        })(currNs, collPromise));
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
          var key = ns + ':' + alias + ':' + property + ':' + (prop || '');
          depPromises[key] = promisesByNs[ns][alias] = promisesByNs[ns][alias] || new Promise;
        }
        Promise.parallel(depPromises).on(
          promiseCallback(model, doc, currNs, collPromise, currAlias, promisesByNs, ignore)
        );
      } else {
        createDoc(model, currNs, collPromise, currAlias, doc, promisesByNs, ignore);
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
  totalPromise.on( function (err) { cb(err, !err); });
}

function promiseCallback (model, doc, currNs, collPromise, currAlias, promisesByNs, ignore) {
  return function (err, values) {
    if (err) throw err;
    for (var key in values) {
      var val       = values[key]
        , quad      = key.split(':')
        , _ns       = quad[0]
        , _alias    = quad[1]
        , _property = quad[2]
        , _prop     = quad[3]
      assign(doc, _property, _prop ? val[_prop] : val);
    }
    createDoc(model, currNs, collPromise, currAlias, doc, promisesByNs, ignore);
  };
}

function createDoc (model, ns, collPromise, alias, doc, promisesByNs, ignore) {
  var k, v;
  for (k in doc) {
    v = doc[k];
    if (typeof v === 'function') doc[k] = v();
  }
  collPromise.on( function (err, coll) {
    if (err) throw err;
    for (k in coll) {
      if (deepEqual(doc, coll[k], ignore)) return;
    }
    var id = model.add(ns, doc, function (err) {
      if (err) throw err;
      doc.id = id;
      debug('CREATED ' + ns + ' ' + alias + " \n" + inspect(doc, false, null));
      promisesByNs[ns][alias].resolve(err, doc);
    });
  });
}

function parseDoc (doc, cbs, prefix) {
  prefix = prefix || '';
  var onFixture = cbs.onFixture;
  var onIgnore = cbs.onIgnore;
  var iterator = (Array.isArray(doc)) ?
    eachMember :
    eachChild;
  iterator(doc, function (value, property) {
    if (Array.isArray(value)) {
      return parseDoc(value, cbs, (prefix ? prefix + '.' : '') + property);
    }
    if (value.constructor !== Object) return;
    if (value.$fixture) {
      onFixture((prefix ? prefix + '.' : '') + property, value.ns, value.alias, value.prop);
    } else if (value.$unique) {
      onIgnore((prefix ? prefix + '.' : '') + property, value);
    } else {
      parseDoc(value, cbs, (prefix ? prefix + '.' : '') + property);
    }
  });
}

function eachChild (object, cb) {
  for (var k in object) cb(object[k], k);
}

function eachMember (array, cb) {
  array.forEach(cb);
}
