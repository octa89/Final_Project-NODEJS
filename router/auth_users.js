const express = require('express');
const jwt = require('jsonwebtoken');  // Import JWT for token management
let books = require("./booksdb.js");  // Import books database
const regd_users = express.Router();  // Create router for registered users

let users = [];  // Store users in an array for this example

// Function to check if a username is valid
const isValid = (username) => {
  return users.some(user => user.username === username);
};

// Function to authenticate user credentials
const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];  // Extract Authorization header
  const token = authHeader && authHeader.split(' ')[1];  // Get token after 'Bearer'

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    req.user = decoded;  // Store decoded user info
    next();  // Proceed to the next middleware or route
  });
};

// Login route for registered users
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Generate a JWT token upon successful login
  const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

  // Store the token in the session
  req.session.token = token;

  res.status(200).json({ message: "Login successful", token });
});

// Route to add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const username = req.user.username;  // Retrieved from the decoded JWT

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};  // Initialize reviews object if it doesn't exist
  }

  // Add or update the user's review for the given book
  books[isbn].reviews[username] = review;

  res.status(200).json({ message: "Review added/updated successfully" });
});

// Route to delete a review by the logged-in user
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;  // Get the ISBN from the request parameters
  const username = req.user.username;  // Get the logged-in user's username from JWT

  // Check if the book exists and the user has a review for it
  if (!books[isbn] || !books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Delete the user's review
  delete books[isbn].reviews[username];

  res.status(200).json({ message: "Review deleted successfully" });
});


// Apply the JWT verification middleware to all /auth routes
regd_users.use("/auth/*", verifyToken);

// Export the router and helper functions
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
