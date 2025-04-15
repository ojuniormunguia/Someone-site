const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sendNewRequestNotification } = require('../utils/email');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/references');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'reference-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Submit a new commission request
router.post('/', optionalAuth, upload.array('references', 10), async (req, res) => {
  try {
    const { 
      serviceId, 
      description, 
      characterCount, 
      alternativeCount, 
      poseCount, 
      isNSFW, 
      username, 
      password, 
      email,
      totalPrice 
    } = req.body;
    
    if (!serviceId || !description) {
      return res.status(400).json({ message: 'Service ID and description are required' });
    }
    
    // Validate service exists
    const serviceResult = await db.query(`
      SELECT ServiceID, ServiceName
      FROM Services
      WHERE ServiceID = @serviceId AND IsActive = 1
    `, [
      { name: 'serviceId', type: db.sql.Int, value: serviceId }
    ]);
    
    if (serviceResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    let userId = req.user ? req.user.userId : null;
    
    // If user is not logged in, register new user
    if (!userId) {
      if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required for new users' });
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
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const userResult = await db.query(`
        INSERT INTO Users (Username, Password, Email)
        OUTPUT INSERTED.UserID
        VALUES (@username, @password, @email)
      `, [
        { name: 'username', type: db.sql.NVarChar, value: username },
        { name: 'password', type: db.sql.NVarChar, value: hashedPassword },
        { name: 'email', type: db.sql.NVarChar, value: email }
      ]);
      
      userId = userResult.recordset[0].UserID;
    }
    
    // Process uploaded reference files
    const references = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        references.push('/uploads/references/' + path.basename(file.path));
      }
    }
    
    // Insert new request
    const requestResult = await db.query(`
      INSERT INTO Requests (
        UserID, 
        ServiceID, 
        Description, 
        CharacterCount, 
        AlternativeCount, 
        PoseCount, 
        References, 
        IsNSFW,
        TotalPrice
      )
      OUTPUT INSERTED.RequestID
      VALUES (
        @userId, 
        @serviceId, 
        @description, 
        @characterCount, 
        @alternativeCount, 
        @poseCount, 
        @references, 
        @isNSFW,
        @totalPrice
      )
    `, [
      { name: 'userId', type: db.sql.Int, value: userId },
      { name: 'serviceId', type: db.sql.Int, value: serviceId },
      { name: 'description', type: db.sql.NText, value: description },
      { name: 'characterCount', type: db.sql.Int, value: characterCount || 1 },
      { name: 'alternativeCount', type: db.sql.Int, value: alternativeCount || 0 },
      { name: 'poseCount', type: db.sql.Int, value: poseCount || 1 },
      { name: 'references', type: db.sql.NText, value: JSON.stringify(references) },
      { name: 'isNSFW', type: db.sql.Bit, value: isNSFW === 'true' || isNSFW === true ? 1 : 0 },
      { name: 'totalPrice', type: db.sql.Decimal(10, 2), value: parseFloat(totalPrice) || null }
    ]);
    
    const requestId = requestResult.recordset[0].RequestID;
    
    // Send email notification
    const userInfo = await db.query(`
      SELECT Username, Email
      FROM Users
      WHERE UserID = @userId
    `, [
      { name: 'userId', type: db.sql.Int, value: userId }
    ]);
    
    const user = userInfo.recordset[0];
    
    await sendNewRequestNotification({
      username: user.Username,
      serviceName: serviceResult.recordset[0].ServiceName,
      characterCount: characterCount || 1,
      alternativeCount: alternativeCount || 0,
      poseCount: poseCount || 1,
      totalPrice: parseFloat(totalPrice) || 0,
      isNSFW: isNSFW === 'true' || isNSFW === true,
      description
    });
    
    // If user was newly created, generate and return token
    let token = null;
    if (!req.user) {
      const { generateToken } = require('../middleware/auth');
      token = generateToken({
        UserID: userId,
        Username: username,
        IsVIP: false
      });
    }
    
    res.status(201).json({
      message: 'Commission request submitted successfully',
      requestId,
      token
    });
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.RequestID, r.ServiceID, r.Description, r.CharacterCount, r.AlternativeCount, 
             r.PoseCount, r.IsNSFW, r.TotalPrice, r.RequestDate, r.Status,
             s.ServiceName
      FROM Requests r
      JOIN Services s ON r.ServiceID = s.ServiceID
      WHERE r.UserID = @userId
      ORDER BY r.RequestDate DESC
    `, [
      { name: 'userId', type: db.sql.Int, value: req.user.userId }
    ]);
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    
    const result = await db.query(`
      SELECT r.RequestID, r.UserID, r.ServiceID, r.Description, r.CharacterCount, r.AlternativeCount, 
             r.PoseCount, r.References, r.IsNSFW, r.TotalPrice, r.RequestDate, r.Status,
             s.ServiceName
      FROM Requests r
      JOIN Services s ON r.ServiceID = s.ServiceID
      WHERE r.RequestID = @requestId
    `, [
      { name: 'requestId', type: db.sql.Int, value: requestId }
    ]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    const request = result.recordset[0];
    
    // Check if user owns this request
    if (request.UserID !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Parse references JSON
    if (request.References) {
      try {
        request.References = JSON.parse(request.References);
      } catch (e) {
        request.References = [];
      }
    } else {
      request.References = [];
    }
    
    res.status(200).json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 