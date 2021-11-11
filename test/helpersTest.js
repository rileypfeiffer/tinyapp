const { assert } = require('chai');

const { emailLookupHelper } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = emailLookupHelper("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });
  it('should return undefined when an email that is not in the database is passed', function() {
    const user = emailLookupHelper("user5@example.com", testUsers);
    const expectedUserID = undefined;
    assert.equal(user, expectedUserID);
  })
});
