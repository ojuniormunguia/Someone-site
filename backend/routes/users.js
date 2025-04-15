const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/users');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + req.user.userId + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT UserID, Username, Email, ProfilePicture, Banner, Description, IsVIP, CreatedAt
      FROM Users
      WHERE UserID = @userId
    `, [
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    
    // Get user's commissions
    const commissionsResult = await db.query(`
      SELECT c.CommissionID, c.Status, c.Progress, c.ExpectedCompletionDate, c.Complexity, c.IsPublicWork,
             r.Description, r.TotalPrice, r.IsNSFW,
             (SELECT TOP 1 ImagePath FROM CommissionUpdates 
              WHERE CommissionID = c.CommissionID 
              ORDER BY UpdateDate DESC) as LatestUpdate
      FROM Commissions c
      JOIN Requests r ON c.RequestID = r.RequestID
      WHERE r.UserID = @userId
      ORDER BY c.CreatedAt DESC
    `, [
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    res.status(200).json({
      user: {
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        profilePicture: user.ProfilePicture,
        banner: user.Banner,
        description: user.Description,
        isVip: user.IsVIP,
        createdAt: user.CreatedAt
      },
      commissions: commissionsResult.recordset
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, description } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Check if username is already taken by another user
    const existingUser = await db.query(`
      SELECT UserID FROM Users WHERE Username = @username AND UserID != @userId
    `, [
      { name: 'username', type: db.sql.NVarChar, value: username },
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    
    // Update user
    await db.query(`
      UPDATE Users
      SET Username = @username, 
          Description = @description,
          UpdatedAt = GETDATE()
      WHERE UserID = @userId
    `, [
      { name: 'username', type: db.sql.NVarChar, value: username },
      { name: 'description', type: db.sql.NText, value: description || null },
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile picture
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = '/uploads/users/' + path.basename(req.file.path);
    
    // Update user profile picture
    await db.query(`
      UPDATE Users
      SET ProfilePicture = @profilePicture,
          UpdatedAt = GETDATE()
      WHERE UserID = @userId
    `, [
      { name: 'profilePicture', type: db.sql.NVarChar, value: filePath },
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    res.status(200).json({ 
      message: 'Profile picture uploaded successfully',
      profilePicture: filePath
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload banner
router.post('/banner', authenticateToken, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = '/uploads/users/' + path.basename(req.file.path);
    
    // Update user banner
    await db.query(`
      UPDATE Users
      SET Banner = @banner,
          UpdatedAt = GETDATE()
      WHERE UserID = @userId
    `, [
      { name: 'banner', type: db.sql.NVarChar, value: filePath },
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    res.status(200).json({ 
      message: 'Banner uploaded successfully',
      banner: filePath
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 