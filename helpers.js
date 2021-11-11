const emailLookupHelper = function(str, database) {
  for (let user in database) {
    if (database[user].email === str) {
      return user;
    }
  }
  return undefined;
};

module.exports = { emailLookupHelper };