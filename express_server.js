const express = require("express");
const app = express();
const bcrypt = require('bcryptjs');
const { emailLookupHelper } = require('./helpers');
const cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const urlsForUser = function(id) {
  let userShortURLs = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userShortURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userShortURLs;
};

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


app.set("view engine", "ejs"); // Tells the Express app to use EJS as its templating engine

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

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  let urlsOfUser = urlsForUser(user);
  const templateVars = { user: users[user], urls: urlsOfUser };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.status(400).send("Login to create a URL");
  }
  else {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id};
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${newShortURL}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send("Does not exist");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

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

app.post("/login", (req, res) => {
  const user = emailLookupHelper(req.body.email, users);
  if (emailLookupHelper(req.body.email, users)) { 
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect("/urls");
    } else {
      res.status(403).send("Password incorrect.")
    }
  } else {
    res.status(403).send("The email entered is not registered.")
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please enter both a valid e-mail and a password.");
  } else if (emailLookupHelper(req.body.email, users) !== undefined) {
    res.status(400).send("Email already in use.");
  } else {
  let user = generateRandomString();
  users[user] = { id: user, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
  req.session.user_id = user;
  res.redirect("/urls");
  console.log(users);
  }
});


