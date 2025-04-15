const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { generateToken } = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Query user from database
    const result = await db.query(`
      SELECT UserID, Username, Password, Email, IsVIP
      FROM Users
      WHERE Username = @username
    `, [
      { name: 'username', type: db.sql.NVarChar, value: username }
    ]);
    
    const user = result.recordset[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        isVip: user.IsVIP
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register route (to be used only through the commission request flow for new clients)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password, and email are required' });
    }
    
    // Check if username or email already exists
    const existingUser = await db.query(`
      SELECT Username, Email
      FROM Users
      WHERE Username = @username OR Email = @email
    `, [
      { name: 'username', type: db.sql.NVarChar, value: username },
      { name: 'email', type: db.sql.NVarChar, value: email }
    ]);
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ 
        message: 'Username or email already exists',
        isEmailTaken: existingUser.recordset.some(u => u.Email === email),
        isUsernameTaken: existingUser.recordset.some(u => u.Username === username)
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await db.query(`
      INSERT INTO Users (Username, Password, Email)
      OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.IsVIP
      VALUES (@username, @password, @email)
    `, [
      { name: 'username', type: db.sql.NVarChar, value: username },
      { name: 'password', type: db.sql.NVarChar, value: hashedPassword },
      { name: 'email', type: db.sql.NVarChar, value: email }
    ]);
    
    const newUser = result.recordset[0];
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: newUser.UserID,
        username: newUser.Username,
        email: newUser.Email,
        isVip: newUser.IsVIP
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate token route
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    // Verify token
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    
    // Get user info
    const result = await db.query(`
      SELECT UserID, Username, Email, IsVIP
      FROM Users
      WHERE UserID = @userId
    `, [
      { name: 'userId', type: db.sql.Int, value: decoded.userId }
    ]);
    
    const user = result.recordset[0];
    
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    
    res.status(200).json({
      valid: true,
      user: {
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        isVip: user.IsVIP
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

module.exports = router; 