const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sendStatusUpdateNotification } = require('../utils/email');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/commissions');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'commission-' + req.params.id + '-update-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file size limit
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get all commissions (with optional filters for the kanban view)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT c.CommissionID, c.Status, c.Progress, c.ExpectedCompletionDate, c.Complexity, c.IsPublicWork,
             r.Description, r.CharacterCount, r.AlternativeCount, r.PoseCount, r.IsNSFW, r.TotalPrice,
             u.Username as ClientName,
             (SELECT TOP 1 ImagePath FROM CommissionUpdates 
              WHERE CommissionID = c.CommissionID 
              ORDER BY UpdateDate DESC) as LatestUpdate
      FROM Commissions c
      JOIN Requests r ON c.RequestID = r.RequestID
      JOIN Users u ON r.UserID = u.UserID
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add status filter if provided
    if (status) {
      query += ` AND c.Status = @status`;
      params.push({ name: 'status', type: db.sql.NVarChar, value: status });
    }
    
    // Handle unauthenticated users - only show non-NSFW or public commissions
    if (!req.user) {
      query += ` AND (r.IsNSFW = 0 OR c.IsPublicWork = 1)`;
    }
    
    query += ` ORDER BY c.CreatedAt DESC`;
    
    const result = await db.query(query, params);
    
    // If user is not authenticated, limit information in response
    const commissions = result.recordset.map(commission => {
      // For unauthenticated users, remove sensitive info and latest update image for NSFW content
      if (!req.user) {
        return {
          commissionId: commission.CommissionID,
          status: commission.Status,
          progress: commission.Progress,
          complexity: commission.Complexity,
          characterCount: commission.CharacterCount,
          alternativeCount: commission.AlternativeCount,
          poseCount: commission.PoseCount,
          // Only include latest update if commission is marked as public
          latestUpdate: commission.IsPublicWork ? commission.LatestUpdate : null
        };
      }
      
      // For authenticated users, return full info
      return commission;
    });
    
    res.status(200).json(commissions);
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get commissions by status for kanban view
router.get('/kanban', optionalAuth, async (req, res) => {
  try {
    // Get requests in "Requested" status
    let requestsQuery = `
      SELECT r.RequestID, r.Description, r.CharacterCount, r.AlternativeCount, r.PoseCount, 
             r.IsNSFW, r.TotalPrice, r.RequestDate, r.Status,
             u.Username as ClientName
      FROM Requests r
      JOIN Users u ON r.UserID = u.UserID
      WHERE r.Status = 'Requested'
    `;
    
    // If user is not authenticated, only show non-NSFW requests
    if (!req.user) {
      requestsQuery += ` AND r.IsNSFW = 0`;
    }
    
    requestsQuery += ` ORDER BY r.RequestDate DESC`;
    
    const requestsResult = await db.query(requestsQuery);
    
    // Get all commissions grouped by status for kanban columns
    let commissionsQuery = `
      SELECT c.CommissionID, c.Status, c.Progress, c.ExpectedCompletionDate, c.Complexity, c.IsPublicWork,
             r.Description, r.CharacterCount, r.AlternativeCount, r.PoseCount, r.IsNSFW, r.TotalPrice,
             u.Username as ClientName,
             (SELECT TOP 1 ImagePath FROM CommissionUpdates 
              WHERE CommissionID = c.CommissionID 
              ORDER BY UpdateDate DESC) as LatestUpdate
      FROM Commissions c
      JOIN Requests r ON c.RequestID = r.RequestID
      JOIN Users u ON r.UserID = u.UserID
      WHERE c.Status IN ('Accepted', 'Working', 'Waiting', 'Finished')
    `;
    
    // If user is not authenticated, only show non-NSFW or public commissions
    if (!req.user) {
      commissionsQuery += ` AND (r.IsNSFW = 0 OR c.IsPublicWork = 1)`;
    }
    
    commissionsQuery += ` ORDER BY c.UpdatedAt DESC`;
    
    const commissionsResult = await db.query(commissionsQuery);
    
    // Group commissions by status
    const kanban = {
      Requested: requestsResult.recordset.map(request => {
        // For unauthenticated users, limit information
        if (!req.user) {
          return {
            requestId: request.RequestID,
            date: request.RequestDate,
            characterCount: request.CharacterCount,
            alternativeCount: request.AlternativeCount,
            poseCount: request.PoseCount,
            complexity: calculateComplexity(request)
          };
        }
        return request;
      }),
      Accepted: [],
      Working: [],
      Waiting: [],
      Finished: []
    };
    
    // Process commissions and assign to appropriate kanban column
    commissionsResult.recordset.forEach(commission => {
      // For unauthenticated users, limit information
      if (!req.user) {
        const limitedInfo = {
          commissionId: commission.CommissionID,
          status: commission.Status,
          progress: commission.Progress,
          complexity: commission.Complexity,
          characterCount: commission.CharacterCount,
          alternativeCount: commission.AlternativeCount,
          poseCount: commission.PoseCount
        };
        
        // Only include latest update image if commission is marked as public
        if (commission.IsPublicWork) {
          limitedInfo.latestUpdate = commission.LatestUpdate;
        }
        
        kanban[commission.Status].push(limitedInfo);
      } else {
        kanban[commission.Status].push(commission);
      }
    });
    
    res.status(200).json(kanban);
  } catch (error) {
    console.error('Get kanban error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific commission
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const commissionId = req.params.id;
    
    // Get commission details
    const commissionQuery = `
      SELECT c.CommissionID, c.RequestID, c.Status, c.Progress, c.ExpectedCompletionDate, 
             c.ActualCompletionDate, c.Complexity, c.IsPublicWork, c.CreatedAt, c.UpdatedAt,
             r.Description, r.CharacterCount, r.AlternativeCount, r.PoseCount, r.References,
             r.IsNSFW, r.TotalPrice, r.UserID as ClientID,
             u.Username as ClientName, u.Email as ClientEmail
      FROM Commissions c
      JOIN Requests r ON c.RequestID = r.RequestID
      JOIN Users u ON r.UserID = u.UserID
      WHERE c.CommissionID = @commissionId
    `;
    
    const commissionResult = await db.query(commissionQuery, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    if (commissionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Commission not found' });
    }
    
    const commission = commissionResult.recordset[0];
    
    // Check if the user has access to this commission
    const isOwner = req.user && req.user.userId === commission.ClientID;
    
    // For NSFW content, require authentication unless it's marked as public
    if (commission.IsNSFW && !commission.IsPublicWork && !req.user) {
      return res.status(403).json({ 
        message: 'Authentication required to view this commission',
        isNSFW: true
      });
    }
    
    // Get commission updates
    const updatesQuery = `
      SELECT UpdateID, UpdateTitle, Description, ImagePath, VideoPath, UpdateDate
      FROM CommissionUpdates
      WHERE CommissionID = @commissionId
      ORDER BY UpdateDate DESC
    `;
    
    const updatesResult = await db.query(updatesQuery, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    // Get commission tags
    const tagsQuery = `
      SELECT t.TagID, t.TagName
      FROM CommissionTags ct
      JOIN Tags t ON ct.TagID = t.TagID
      WHERE ct.CommissionID = @commissionId
    `;
    
    const tagsResult = await db.query(tagsQuery, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    // Parse references JSON
    if (commission.References) {
      try {
        commission.References = JSON.parse(commission.References);
      } catch (e) {
        commission.References = [];
      }
    } else {
      commission.References = [];
    }
    
    // Customize response based on user authentication status
    if (!req.user && !commission.IsPublicWork) {
      // For unauthenticated users viewing non-public commissions, limit information
      res.status(200).json({
        commissionId: commission.CommissionID,
        status: commission.Status,
        progress: commission.Progress,
        complexity: commission.Complexity,
        characterCount: commission.CharacterCount,
        alternativeCount: commission.AlternativeCount,
        poseCount: commission.PoseCount,
        isNSFW: commission.IsNSFW,
        createdAt: commission.CreatedAt,
        updatedAt: commission.UpdatedAt
        // No updates or references included
      });
    } else {
      // For authenticated users or public commissions, return full information
      const response = {
        ...commission,
        isOwner,
        updates: updatesResult.recordset,
        tags: tagsResult.recordset
      };
      
      // Remove sensitive info for non-owners
      if (!isOwner) {
        delete response.ClientEmail;
      }
      
      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Get commission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add update to a commission
router.post('/:id/updates', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const commissionId = req.params.id;
    const { title, description } = req.body;
    
    // Validate commission exists
    const commissionResult = await db.query(`
      SELECT c.CommissionID, r.UserID as ClientID
      FROM Commissions c
      JOIN Requests r ON c.RequestID = r.RequestID
      WHERE c.CommissionID = @commissionId
    `, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    if (commissionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Commission not found' });
    }
    
    // Process uploaded file
    let imagePath = null;
    let videoPath = null;
    
    if (req.file) {
      const filePath = '/uploads/commissions/' + path.basename(req.file.path);
      
      // Determine if it's a video or image
      if (req.file.mimetype.startsWith('video/')) {
        videoPath = filePath;
      } else {
        imagePath = filePath;
      }
    }
    
    // Insert update
    const updateResult = await db.query(`
      INSERT INTO CommissionUpdates (CommissionID, UpdateTitle, Description, ImagePath, VideoPath)
      OUTPUT INSERTED.UpdateID
      VALUES (@commissionId, @title, @description, @imagePath, @videoPath)
    `, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId },
      { name: 'title', type: db.sql.NVarChar, value: title || null },
      { name: 'description', type: db.sql.NText, value: description || null },
      { name: 'imagePath', type: db.sql.NVarChar, value: imagePath },
      { name: 'videoPath', type: db.sql.NVarChar, value: videoPath }
    ]);
    
    const updateId = updateResult.recordset[0].UpdateID;
    
    // Update commission's last updated timestamp
    await db.query(`
      UPDATE Commissions
      SET UpdatedAt = GETDATE()
      WHERE CommissionID = @commissionId
    `, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    // Send email notification to client
    const clientQuery = `
      SELECT u.Email, u.Username
      FROM Users u
      JOIN Requests r ON u.UserID = r.UserID
      JOIN Commissions c ON r.RequestID = c.RequestID
      WHERE c.CommissionID = @commissionId
    `;
    
    const clientResult = await db.query(clientQuery, [
      { name: 'commissionId', type: db.sql.Int, value: commissionId }
    ]);
    
    if (clientResult.recordset.length > 0) {
      const client = clientResult.recordset[0];
      
      // Get commission details for email
      const commissionDetailsQuery = `
        SELECT Status, Progress, ExpectedCompletionDate
        FROM Commissions
        WHERE CommissionID = @commissionId
      `;
      
      const commissionDetails = await db.query(commissionDetailsQuery, [
        { name: 'commissionId', type: db.sql.Int, value: commissionId }
      ]);
      
      if (commissionDetails.recordset.length > 0) {
        await sendStatusUpdateNotification(client.Email, {
          status: commissionDetails.recordset[0].Status,
          progress: commissionDetails.recordset[0].Progress,
          expectedCompletionDate: commissionDetails.recordset[0].ExpectedCompletionDate
        });
      }
    }
    
    res.status(201).json({
      message: 'Update added successfully',
      updateId
    });
  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate complexity based on request details
function calculateComplexity(request) {
  let complexity = 'Low';
  const basePrice = 35;
  let totalPrice = basePrice;
  
  // Calculate price for additional characters: +3+([amount]*2)
  if (request.CharacterCount > 1) {
    totalPrice += 3 + ((request.CharacterCount - 1) * 2);
  }
  
  // Calculate price for alternatives: +3*[amount]
  if (request.AlternativeCount > 0) {
    totalPrice += 3 * request.AlternativeCount;
  }
  
  // Calculate price for additional poses: +5+[amount]
  if (request.PoseCount > 1) {
    totalPrice += 5 + (request.PoseCount - 1);
  }
  
  // Determine complexity based on calculated total price
  if (totalPrice > 150) {
    complexity = 'Sistine Chapel';
  } else if (totalPrice > 100) {
    complexity = 'Ultra High';
  } else if (totalPrice > 70) {
    complexity = 'High';
  } else if (totalPrice > 45) {
    complexity = 'Mid';
  }
  
  return complexity;
}

module.exports = router; 