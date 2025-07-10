const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { generateReportPDF } = require('./pdfGenerator');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Email configuration from environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'otrdatatrack@gmail.com',
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // Check if email credentials are properly configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email service not fully configured: EMAIL_PASSWORD not set');
      console.log('📧 Email service will be disabled. Set EMAIL_PASSWORD to enable email functionality.');
      this.transporter = null;
      return;
    }

    // Create transporter
    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service configuration error:', error);
        console.log('📧 Email service will be disabled. Check EMAIL_PASSWORD and EMAIL_USER configuration.');
        this.transporter = null;
      } else {
        console.log('✅ Email service is ready to send messages');
      }
    });
  }

  /**
   * Send session report via email with PDF attachment
   */
  async sendSessionReport(sessionId, recipientEmail, reportData) {
    try {
      if (!this.transporter) {
        console.warn('⚠️  Email service not available - skipping email send');
        return {
          success: false,
          message: 'Email service not configured',
          recipient: recipientEmail
        };
      }

      if (!recipientEmail || !reportData) {
        throw new Error('Recipient email and report data are required');
      }

      console.log(`📧 Sending session report email to: ${recipientEmail}`);

      // Generate PDF
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const fileName = `OTR_Report_${reportData.player.name.replace(/\s+/g, '_')}_${new Date(reportData.session.date).toISOString().split('T')[0]}.pdf`;
      const filePath = path.join(reportsDir, fileName);

      await generateReportPDF(reportData, filePath);

      // Format session date
      const sessionDate = new Date(reportData.session.date);
      const formattedDate = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = sessionDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Email content
      const emailSubject = `OTR Baseball Analytics Report - ${reportData.player.name} - ${formattedDate}`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #1a2340; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .metric { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #1a2340; }
            .highlight { color: #1a2340; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OTR Baseball Analytics Report</h1>
            <p>Performance Analysis & Insights</p>
          </div>
          
          <div class="content">
            <h2>Session Report Summary</h2>
            
            <div class="metric">
              <strong>Player:</strong> <span class="highlight">${reportData.player.name}</span>
            </div>
            
            <div class="metric">
              <strong>Session Date:</strong> <span class="highlight">${formattedDate}</span>
            </div>
            
            <div class="metric">
              <strong>Session Time:</strong> <span class="highlight">${formattedTime}</span>
            </div>
            
            <div class="metric">
              <strong>Session Number:</strong> <span class="highlight">#${reportData.session.id}</span>
            </div>
            
            <div class="metric">
              <strong>Session Type:</strong> <span class="highlight">${reportData.session.type.toUpperCase()}</span>
            </div>
            
            <div class="metric">
              <strong>Player Level:</strong> <span class="highlight">${reportData.player.level}</span>
            </div>

            ${this.generateMetricsHtml(reportData)}
            
            <p style="margin-top: 30px;">
              <strong>📎 Attachment:</strong> This email includes a detailed PDF report with comprehensive analytics, 
              including performance metrics, strike zone analysis, and visual charts.
            </p>
            
            <p style="margin-top: 20px;">
              <strong>📊 What's in the PDF:</strong>
            </p>
            <ul>
              <li>Detailed performance metrics with benchmarks</li>
              <li>Strike zone hot zones visualization</li>
              <li>Performance grades and analysis</li>
              <li>Session comparison data</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This report was generated by OTR Baseball Analytics Platform</p>
            <p>Visit us at: <a href="https://otr-data.com">https://otr-data.com</a></p>
            <p>From: otrdatatrack@gmail.com</p>
            <p>One-time password: exwx bdjz xjid qhmh</p>
          </div>
        </body>
        </html>
      `;

      const emailText = `
OTR Baseball Analytics Report

Session Report Summary:
- Player: ${reportData.player.name}
- Session Date: ${formattedDate}
- Session Time: ${formattedTime}
- Session Number: #${reportData.session.id}
- Session Type: ${reportData.session.type.toUpperCase()}
- Player Level: ${reportData.player.level}

${this.generateMetricsText(reportData)}

📎 Attachment: This email includes a detailed PDF report with comprehensive analytics.

📊 What's in the PDF:
- Detailed performance metrics with benchmarks
- Strike zone hot zones visualization
- Performance grades and analysis
- Session comparison data

---
This report was generated by OTR Baseball Analytics Platform
Visit us at: https://otr-data.com
From: otrdatatrack@gmail.com
One-time password: exwx bdjz xjid qhmh
      `;

      // Send email
      const mailOptions = {
        from: `"OTR Baseball Analytics" <${process.env.EMAIL_USER || 'otrdatatrack@gmail.com'}>`,
        to: recipientEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: fileName,
            path: filePath,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${recipientEmail}`);

      // Clean up PDF file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: true,
        messageId: result.messageId,
        recipient: recipientEmail
      };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Generate HTML for metrics section
   */
  generateMetricsHtml(reportData) {
    const metrics = reportData.metrics?.exitVelocity || reportData.metrics?.batSpeed;
    if (!metrics) return '<p>No metrics available for this session.</p>';

    let html = '<h3>Key Performance Metrics</h3>';

    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      const ev = reportData.metrics.exitVelocity;
      html += `
        <div class="metric">
          <strong>Max Exit Velocity:</strong> <span class="highlight">${ev.maxExitVelocity || 'N/A'} MPH</span>
          ${ev.grades?.maxExitVelocity ? ` (Grade: ${ev.grades.maxExitVelocity})` : ''}
        </div>
        <div class="metric">
          <strong>Average Exit Velocity:</strong> <span class="highlight">${ev.avgExitVelocity || 'N/A'} MPH</span>
          ${ev.grades?.avgExitVelocity ? ` (Grade: ${ev.grades.avgExitVelocity})` : ''}
        </div>
        <div class="metric">
          <strong>Average Launch Angle:</strong> <span class="highlight">${ev.avgLaunchAngle || 'N/A'}°</span>
          ${ev.grades?.avgLaunchAngle ? ` (Grade: ${ev.grades.avgLaunchAngle})` : ''}
        </div>
        <div class="metric">
          <strong>Total Swings:</strong> <span class="highlight">${ev.dataPoints || 'N/A'}</span>
        </div>
      `;
    } else if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      const bs = reportData.metrics.batSpeed;
      html += `
        <div class="metric">
          <strong>Max Bat Speed:</strong> <span class="highlight">${bs.maxBatSpeed || 'N/A'} MPH</span>
          ${bs.grades?.maxBatSpeed ? ` (Grade: ${bs.grades.maxBatSpeed})` : ''}
        </div>
        <div class="metric">
          <strong>Average Bat Speed:</strong> <span class="highlight">${bs.avgBatSpeed || 'N/A'} MPH</span>
          ${bs.grades?.avgBatSpeed ? ` (Grade: ${bs.grades.avgBatSpeed})` : ''}
        </div>
        <div class="metric">
          <strong>Average Attack Angle:</strong> <span class="highlight">${bs.avgAttackAngle || 'N/A'}°</span>
          ${bs.grades?.attackAngle ? ` (Grade: ${bs.grades.attackAngle})` : ''}
        </div>
        <div class="metric">
          <strong>Total Swings:</strong> <span class="highlight">${bs.dataPoints || 'N/A'}</span>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate text for metrics section
   */
  generateMetricsText(reportData) {
    const metrics = reportData.metrics?.exitVelocity || reportData.metrics?.batSpeed;
    if (!metrics) return 'No metrics available for this session.';

    let text = 'Key Performance Metrics:\n';

    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      const ev = reportData.metrics.exitVelocity;
      text += `
- Max Exit Velocity: ${ev.maxExitVelocity || 'N/A'} MPH${ev.grades?.maxExitVelocity ? ` (Grade: ${ev.grades.maxExitVelocity})` : ''}
- Average Exit Velocity: ${ev.avgExitVelocity || 'N/A'} MPH${ev.grades?.avgExitVelocity ? ` (Grade: ${ev.grades.avgExitVelocity})` : ''}
- Average Launch Angle: ${ev.avgLaunchAngle || 'N/A'}°${ev.grades?.avgLaunchAngle ? ` (Grade: ${ev.grades.avgLaunchAngle})` : ''}
- Total Swings: ${ev.dataPoints || 'N/A'}
      `;
    } else if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      const bs = reportData.metrics.batSpeed;
      text += `
- Max Bat Speed: ${bs.maxBatSpeed || 'N/A'} MPH${bs.grades?.maxBatSpeed ? ` (Grade: ${bs.grades.maxBatSpeed})` : ''}
- Average Bat Speed: ${bs.avgBatSpeed || 'N/A'} MPH${bs.grades?.avgBatSpeed ? ` (Grade: ${bs.grades.avgBatSpeed})` : ''}
- Average Attack Angle: ${bs.avgAttackAngle || 'N/A'}°${bs.grades?.attackAngle ? ` (Grade: ${bs.grades.attackAngle})` : ''}
- Total Swings: ${bs.dataPoints || 'N/A'}
      `;
    }

    return text;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const testEmail = process.env.EMAIL_USER || 'otrdatatrack@gmail.com';
      
      const mailOptions = {
        from: `"OTR Baseball Analytics" <${testEmail}>`,
        to: testEmail,
        subject: 'OTR Baseball Analytics - Email Configuration Test',
        text: 'This is a test email to verify the email configuration is working properly.',
        html: '<h2>Email Configuration Test</h2><p>This is a test email to verify the email configuration is working properly.</p>'
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email configuration test successful');
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService; 