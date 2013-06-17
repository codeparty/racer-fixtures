racer-fixtures
==============

Declarative data fixtures for Racer

# Instructions

Fixtures come in handy for tests, creating sample data for an app, and other
similar situations. `racer-fixtures` makes it easy to generate fixtures using a
straightforward JSON structure and without needing to figure out in what order
to create documents that are dependent on one another.

Let's take a look at an example:

```javascript
var store = racer.createStore();

var racerFixtures = require('racer-fixtures')
  , fixture = racerFixtures.fixture
  , loadFixtures = racerFixtures.loadFixtures
  ;

var fixtures = {
  // For the users namespace
  users: {
    // Create a user we'll alias as brian
    brian: {
      name: 'Brian'
    , location: 'San Francisco'
    , groupId: fixture('groups', 'derby', 'id')
    , createdAt: now // now is run every time we use it, and its return value
                     // is assigned to createdAt
    }
    // And create a user we'll alias as nate
  , nate: {
      name: 'Nate'
    , location: 'San Francisco'
    , groupId: fixture('groups', 'derby', 'id')
    , createdAt: now
    }
  }

  // For the groups namespace
, groups: {
    // Create a group we'll alias as derby
    derby: {
      name: 'Derby'
    , createdAt: now
    }
  }

  // For the roles namespace
, roles: {
    // Create a role that we'll alias as admin
    admin: {
      groupId: fixture('groups', 'derby', 'id')
    , userId: fixture('users', 'brian', 'id')
    , roles: ['Admin']
    , createdAt: now
    }
  }
};

loadFixtures(fixtures, store, function (err, didSucceed) {
  console.log(err, didSucceed);
});

function now () { return new Date; }
```

This would run code with an equivalent result to the following in racer:

```javascript
var model = store.createModel();
var groupId = model.add('groups', {
  name: 'Admin'
, createdAt: new Date
}, function (err) {
  var brianId = model.add('users', {
    name: 'Brian'
  , location: 'San Francisco'
  , groupId: groupId
  , createdAt: new Date
  }, function (err) {
    var nateId = model.add('users', {
      name: 'Nate'
    , location: 'San Francisco'
    , groupId: groupId
    , createdAt: new Date
    }, function (err) {
        var roleId = store.add('roles', {
          groupId: groupId
        , userId: brianId
        , roles: ['Admin']
        , createdAt: new Date
        }, function (err) {
          console.log(err, !err);
        });
      })
    });
  });
});
```

As you can see, with `racer-fixtures`, you avoid having nested callback hell in
order to create your fixture data. Instead, you just declare what your data
should look like using a JSON format with which everyone is familiar, plus a
`fixture` helper function.

### MIT License
Copyright (c) 2013 by Brian Noguchi and Nate Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
