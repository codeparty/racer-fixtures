racer-fixtures
==============

Declarative data fixtures for Racer

# Instructions

Fixtures come in handy for tests, creating sample data for an app, and other
similar situations. `racer-fixtures` makes it easy to declare what data to
create without figuring out in what order to create the data:

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
    , createdAt: now
    }
  }

, groups: {
    derby: {
      name: 'Derby'
    , createdAt: now
    }
  }
, roles: {
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
store.add('groups', {
  name: 'Admin'
, createdAt: new Date
}, function (err, groupId) {
  store.add('users', {
    name: 'Brian'
  , location: 'San Francisco'
  , groupId: groupId
  , createdAt: new Date
  }, function (err, userId) {
    store.add('roles', {
      groupId: groupId
    , userId: userId
    , roles: ['Admin']
    , createdAt: new Date
    }, function (err, roleId) {
      console.log(err, !!err);
    });
  });
});
```

As you can see, with `racer-fixtures`, you avoid having nested callback hell in
order to create your fixture data. Instead, you just declare what your data
should look like using a JSON format with which everyone is familiar, plus a
`fixture` helper function.

### MIT License
Copyright (c) 2012 by Brian Noguchi and Nate Smith

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
