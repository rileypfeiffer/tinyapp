// Requirements.

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { emailLookupHelper } = require('./helpers');
const cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080

// Tells the Express app to use EJS as its templating engine.
app.set("view engine", "ejs");


app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Generates a random string of letters and numbers to be used as a user's id upon registration.
const generateRandomString = function() {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Assigns URLs to the user that created them.
const urlsForUser = function(id) {
  let userShortURLs = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userShortURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userShortURLs;
};

// Object which stores user id, email, and password for each registered user.
const users = {
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

// Object which stores the created shortURLs and their associated longURL & userID of the user who created them.
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

// Listens for request from PORT which is have declared as 8080.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// The root of the app, redirects user to their saved URLs if logged in, otherwise redirects them to login page.
app.get("/", (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Renders the URL page which displays the list of URLs that the currently logged-in user has made.
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  let urlsOfUser = urlsForUser(user);
  const templateVars = { user: users[user], urls: urlsOfUser };
  res.render("urls_index", templateVars);
});

// Renders the page used to create a new URL if the user is logged in, otherwise it redirects the user to the login page.
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

// Renders the registration page if there is no currently logged-in user, otherwise redirects the logged-in user to their url list.
app.get("/register", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// Renders the login page if there is no currently logged-in user, otherwise redirects the logg-in user to their url list.
app.get("/login", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

/* Logs the user in if the email provided matches one of the emails in the users object and the provided password matches the hashed password stores in the users object, then redirects them to their url list.
If email is not registered or password is incorrect, provides relevant 403 error. */
app.post("/login", (req, res) => {
  const user = emailLookupHelper(req.body.email, users);
  if (emailLookupHelper(req.body.email, users)) {
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect("/urls");
    } else {
      res.status(403).send("Password incorrect.");
    }
  } else {
    res.status(403).send("The email entered is not registered.");
  }
});

// Renders the shortURL page with different html responses depending on whether the shortURL in the path exists in the database or not.
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  }
});

// Sends the user to the longURL associated with the shortURL in the path. If shortURL does not exist, renders appropriate html response.
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

// Creates new urls and redirects the user to the created url's edit page. If the user is not logged in, renders an html response telling them they need to log in to create urls.
app.post("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.status(400).send("Login to create a URL");
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id};
    console.log(req.body);  // Log the POST request body to the console
    res.redirect(`/urls/${newShortURL}`);
  }
});



// Deletes the URL that the selected delete button is associated with only if the logged in user is the user who created the URL.
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.user_id;
  if (urlDatabase[req.params.shortURL] && user === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("You cannot delete a URL that you did not create");
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect("/urls");
});

// When the user ends the session via logging out, causes the session cookie to expire and redirects to the urls page.
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

/* Facilitates the registration of a user account when the user enters a proper email and password, then redirects them to the urls list.
If email is already registered, email or password fields are left empty, or email format is incorrect, renders a suitable html response. */
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter both a valid e-mail and a password.");
  } else if (emailLookupHelper(req.body.email, users) !== undefined) {
    res.status(400).send("Email already in use.");
  } else {
    let user = generateRandomString();
    users[user] = { id: user, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) }; // Hashes the password enterred by the user during registration.
    req.session.user_id = user;
    res.redirect("/urls");
    console.log(users);
  }
});


