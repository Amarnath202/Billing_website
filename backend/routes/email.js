const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const EmailHistory = require('../models/EmailHistory');
require('dotenv').config();

// Validate environment variables
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('Missing email configuration:', {
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS
  });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create email transporter
let transporter;
try {
  // Log email configuration (without showing actual credentials)
  console.log('Initializing email transporter with:', {
    user: process.env.SMTP_USER ? process.env.SMTP_USER : 'NOT_SET'
  });

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter connection
  transporter.verify(function (error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to send emails');
    }
  });
} catch (error) {
  console.error('Error creating email transporter:', error);
}

// Get email history
router.get('/history', async (req, res) => {
  try {
    const history = await EmailHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send email route
router.post('/send', upload.single('attachment'), async (req, res) => {
  try {
    console.log('Received email request:', {
      to: req.body.to,
      subject: req.body.subject,
      hasAttachment: !!req.file
    });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Email configuration is missing. Please check environment variables.');
    }

    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const { to, subject, message, type } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          to: !to,
          subject: !subject,
          message: !message
        }
      });
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: message,
    };

    // If there's an attachment, add it to the email
    if (req.file) {
      console.log('Processing attachment:', req.file);
      mailOptions.attachments = [{
        filename: req.file.originalname,
        path: req.file.path
      }];
    }

    // Send the email
    console.log('Attempting to send email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachment: !!req.file
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);

    // Save to history
    const emailHistory = new EmailHistory({
      to,
      subject,
      message,
      status: 'Sent',
      type: type || 'Other',
      attachmentName: req.file ? req.file.originalname : undefined
    });
    await emailHistory.save();

    // Clean up the uploaded file after sending
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.json({ 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Detailed error sending email:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });

    // Save failed attempt to history
    try {
      const emailHistory = new EmailHistory({
        to: req.body.to,
        subject: req.body.subject,
        message: req.body.message,
        status: 'Failed',
        type: req.body.type || 'Other',
        attachmentName: req.file ? req.file.originalname : undefined,
        error: error.message
      });
      await emailHistory.save();
    } catch (historyError) {
      console.error('Error saving to history:', historyError);
    }

    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message,
      code: error.code
    });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find({}, 'name email');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({}, 'name email');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 