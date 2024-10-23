const express = require('express');
const axios = require('axios');  // Import Axios for HTTP requests
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const userExists = users.some(user => user.username === username);

  if (userExists) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  res.status(201).json({ message: "User registered successfully" });
});

// Get the book list using async/await and Axios
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

// Dummy route to serve books directly
public_users.get('/books', (req, res) => {
  res.status(200).json(books);
});

// Get book details based on ISBN using async/await and Axios
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`http://localhost:5000/books/${isbn}`);
    if (response.data) {
      res.status(200).json(response.data);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    console.error('Error fetching book details:', error.message);
    res.status(500).json({ message: 'Failed to fetch book details' });
  }
});

// Get book details based on author using async/await and Axios
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const response = await axios.get(`http://localhost:5000/books/author/${author}`);
    if (response.data.length > 0) {
      res.status(200).json(response.data);
    } else {
      res.status(404).json({ message: "No books found by this author" });
    }
  } catch (error) {
    console.error('Error fetching books by author:', error.message);
    res.status(500).json({ message: 'Failed to fetch books by author' });
  }
});

// Get book details based on title using async/await and Axios
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const response = await axios.get(`http://localhost:5000/books/title/${title}`);
    
    if (response.data.length > 0) {
      res.status(200).json(response.data);
    } else {
      res.status(404).json({ message: "No books found with this title" });
    }
  } catch (error) {
    console.error('Error fetching books by title:', error.message);
    res.status(500).json({ message: 'Failed to fetch books by title' });
  }
});

// Dummy route to serve books based on title
public_users.get('/books/title/:title', (req, res) => {
  const title = req.params.title;
  const matchingBooks = Object.values(books).filter(book => book.title === title);

  if (matchingBooks.length > 0) {
    res.status(200).json(matchingBooks);
  } else {
    res.status(404).json({ message: "No books found with this title" });
  }
});

// Get book reviews
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book && book.reviews) {
    res.status(200).json(book.reviews);
  } else {
    res.status(404).json({ message: "No reviews found for this book" });
  }
});

module.exports.general = public_users;
