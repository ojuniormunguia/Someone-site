const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: `"Art Commission System" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send new commission request notification
 * @param {object} requestData - Commission request data
 */
async function sendNewRequestNotification(requestData) {
  const subject = 'New Commission Request Received';
  
  const html = `
    <h1>New Commission Request</h1>
    <p>You have received a new commission request from <strong>${requestData.username}</strong>.</p>
    <h2>Request Details:</h2>
    <ul>
      <li><strong>Service:</strong> ${requestData.serviceName}</li>
      <li><strong>Characters:</strong> ${requestData.characterCount}</li>
      <li><strong>Alternatives:</strong> ${requestData.alternativeCount}</li>
      <li><strong>Poses:</strong> ${requestData.poseCount}</li>
      <li><strong>Price:</strong> $${requestData.totalPrice.toFixed(2)}</li>
      <li><strong>NSFW:</strong> ${requestData.isNSFW ? 'Yes' : 'No'}</li>
    </ul>
    <h3>Description:</h3>
    <p>${requestData.description}</p>
    <p>Please log in to your commission system to review and respond to this request.</p>
  `;
  
  return await sendEmail(process.env.EMAIL_USER, subject, html);
}

/**
 * Send commission status update notification to client
 * @param {string} clientEmail - Client's email address
 * @param {object} commissionData - Commission data
 */
async function sendStatusUpdateNotification(clientEmail, commissionData) {
  const subject = `Commission Update: ${commissionData.status}`;
  
  const html = `
    <h1>Commission Status Update</h1>
    <p>Your commission has been updated to: <strong>${commissionData.status}</strong></p>
    <p>Current progress: <strong>${commissionData.progress}</strong></p>
    <p>Expected completion date: <strong>${new Date(commissionData.expectedCompletionDate).toLocaleDateString()}</strong></p>
    <p>You can log in to the commission system to view more details and any updates.</p>
  `;
  
  return await sendEmail(clientEmail, subject, html);
}

module.exports = {
  sendEmail,
  sendNewRequestNotification,
  sendStatusUpdateNotification
}; 