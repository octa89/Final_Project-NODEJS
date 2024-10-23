const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use(  "/customer",  session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true })
);

let users = []; // Temporary in-memory storage for users

// Helper function to authenticate user
const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

// Registration Route for New Users
app.post("/customer/register", (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if the username already exists
  const userExists = users.some(user => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "Username already exists" });
  }

  // Add the new user to the users array
  users.push({ username, password });

  res.status(201).json({ message: "User registered successfully" });
});

// Login Route for Registered Users
app.post("/customer/login", (req, res) => {
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
  req.session.accessToken = token;

  res.status(200).json({ message: "Login successful", token });
});

// Authentication Middleware for Protected Routes
app.use("/customer/auth/*", function auth(req, res, next) {
    // Check for token in the Authorization header
    const authHeader = req.headers['authorization']; // Read Authorization header
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after 'Bearer'
  
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
  
    // Verify the token using JWT
    jwt.verify(token, "your_secret_key", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden: Invalid token" });
      }
      // Attach decoded user information to the request
      req.user = decoded;
      next(); // Proceed to the next middleware or route
    });
  });
  

// Use Routes for Customer and General Endpoints
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Start the Server
const PORT = 5000;
app.listen(PORT, () => console.log("Server is running on port", PORT));