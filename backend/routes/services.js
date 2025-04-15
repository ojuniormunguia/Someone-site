const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all active services with their options
router.get('/', async (req, res) => {
  try {
    // Get all active services
    const servicesResult = await db.query(`
      SELECT ServiceID, ServiceName, Description, BasePrice
      FROM Services
      WHERE IsActive = 1
      ORDER BY ServiceName
    `);
    
    const services = servicesResult.recordset;
    
    // Get options for each service
    for (const service of services) {
      const optionsResult = await db.query(`
        SELECT OptionID, OptionName, Description, PriceFormula, MinValue, MaxValue
        FROM ServiceOptions
        WHERE ServiceID = @serviceId AND IsActive = 1
      `, [
        { name: 'serviceId', type: db.sql.Int, value: service.ServiceID }
      ]);
      
      service.options = optionsResult.recordset;
    }
    
    res.status(200).json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific service by ID with its options
router.get('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // Get service
    const serviceResult = await db.query(`
      SELECT ServiceID, ServiceName, Description, BasePrice
      FROM Services
      WHERE ServiceID = @serviceId AND IsActive = 1
    `, [
      { name: 'serviceId', type: db.sql.Int, value: serviceId }
    ]);
    
    if (serviceResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const service = serviceResult.recordset[0];
    
    // Get options
    const optionsResult = await db.query(`
      SELECT OptionID, OptionName, Description, PriceFormula, MinValue, MaxValue
      FROM ServiceOptions
      WHERE ServiceID = @serviceId AND IsActive = 1
    `, [
      { name: 'serviceId', type: db.sql.Int, value: serviceId }
    ]);
    
    service.options = optionsResult.recordset;
    
    res.status(200).json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Calculate price for a service with options
router.post('/calculate-price', optionalAuth, async (req, res) => {
  try {
    const { serviceId, options } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }
    
    // Get service base price
    const serviceResult = await db.query(`
      SELECT ServiceID, ServiceName, BasePrice
      FROM Services
      WHERE ServiceID = @serviceId AND IsActive = 1
    `, [
      { name: 'serviceId', type: db.sql.Int, value: serviceId }
    ]);
    
    if (serviceResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const service = serviceResult.recordset[0];
    let totalPrice = service.BasePrice;
    let complexity = 'Low'; // Default complexity
    
    // Calculate pricing based on options
    if (options && options.length > 0) {
      // Get all service options
      const optionsResult = await db.query(`
        SELECT OptionID, OptionName, PriceFormula, MinValue, MaxValue
        FROM ServiceOptions
        WHERE ServiceID = @serviceId AND IsActive = 1
      `, [
        { name: 'serviceId', type: db.sql.Int, value: serviceId }
      ]);
      
      const serviceOptions = optionsResult.recordset;
      
      // Calculate price for each option
      for (const optionSelection of options) {
        const option = serviceOptions.find(o => o.OptionID === optionSelection.optionId);
        
        if (option) {
          // Make sure value is within allowed range
          const value = Math.max(option.MinValue, Math.min(option.MaxValue, optionSelection.value));
          
          // Parse and evaluate the price formula
          if (option.PriceFormula) {
            // Simple formula parser (for formulas like "+3+([value]*2)" or "+5+[value]")
            const formula = option.PriceFormula.replace(/\[value\]/g, value);
            
            try {
              // Safe evaluation of the formula
              const addition = new Function('return ' + formula)();
              totalPrice += addition;
            } catch (err) {
              console.error('Error evaluating price formula:', err);
            }
          }
        }
      }
      
      // Determine complexity based on total price
      if (totalPrice > 150) {
        complexity = 'Sistine Chapel';
      } else if (totalPrice > 100) {
        complexity = 'Ultra High';
      } else if (totalPrice > 70) {
        complexity = 'High';
      } else if (totalPrice > 45) {
        complexity = 'Mid';
      }
    }
    
    // Apply VIP discount if applicable
    let discount = 0;
    if (req.user && req.user.isVip) {
      discount = totalPrice * 0.25; // 25% discount for VIP users
      totalPrice -= discount;
    }
    
    res.status(200).json({
      basePrice: service.BasePrice,
      totalPrice,
      discount,
      complexity
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Terms of Service
router.get('/terms-of-service', async (req, res) => {
  // This would typically pull from a database, but for simplicity we'll hard-code a TOS
  res.status(200).json({
    title: "Commission Terms of Service",
    lastUpdated: "2023-01-01",
    sections: [
      {
        title: "General Terms",
        content: `
          1. By commissioning artwork, you agree to these terms.
          2. All artwork remains the intellectual property of the artist.
          3. You will receive the rights to display the commissioned artwork for personal use.
          4. Commercial use requires additional licensing and fees.
          5. The artist reserves the right to display commissioned work in their portfolio.
        `
      },
      {
        title: "Payment",
        content: `
          1. Full payment is required before the commission work begins.
          2. Prices are subject to change based on complexity and requirements.
          3. VIP clients receive a 25% discount on all commissions.
          4. Refunds are available only if work has not yet started.
        `
      },
      {
        title: "Process",
        content: `
          1. You will receive progress updates throughout the commission process.
          2. Revisions are limited to the agreed-upon number in your commission package.
          3. Major changes after approval of sketches may incur additional fees.
          4. Completion time varies based on commission complexity and current workload.
        `
      },
      {
        title: "Content Restrictions",
        content: `
          1. The artist reserves the right to refuse any commission for any reason.
          2. NSFW content will be marked accordingly and only visible to authenticated users.
          3. Certain subject matter may be declined at the artist's discretion.
        `
      }
    ]
  });
});

module.exports = router; 