const crypto = require('crypto');
const { User } = require('../models');
const emailService = require('./emailService');

class InvitationService {
  constructor() {
    this.emailService = emailService;
  }

  /**
   * Generate a secure invitation token
   */
  generateInvitationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a player invitation
   */
  async createPlayerInvitation(inviterId, playerData) {
    const { name, email, position, team } = playerData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already has an account');
    }

    // Generate invitation token
    const invitationToken = this.generateInvitationToken();
    
    // Set expiration to 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Create user with invitation data
    const invitedUser = await User.create({
      name,
      email,
      password: 'temp_password', // Will be changed when invitation is accepted
      role: 'player',
      invitation_token: invitationToken,
      invitation_expires_at: expirationDate,
      invitation_status: 'pending',
      invited_by: inviterId,
      permissions: User.getRolePermissions('player')
    });

    // Send invitation email
    await this.sendInvitationEmail(invitedUser, invitationToken);

    return {
      message: 'Player invitation sent successfully',
      user: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
        invitation_token: invitationToken,
        invitation_status: invitedUser.invitation_status,
        invitation_expires_at: invitedUser.invitation_expires_at
      }
    };
  }

  /**
   * Send invitation email with hidden OTP
   */
  async sendInvitationEmail(user, invitationToken) {
    try {
      // Check if email service is available
      if (!this.emailService.transporter) {
        console.warn('⚠️  Email service not available - invitation created but email not sent');
        console.log('📧 User will need to be notified manually or email service needs to be configured');
        return;
      }

      // Ensure we're using the correct frontend URL
      const frontendUrl = (process.env.FRONTEND_URL || 'https://otr-data.com').trim();
      console.log('🔗 [Invitation] Using FRONTEND_URL:', frontendUrl);
      console.log('🔗 [Invitation] process.env.FRONTEND_URL:', process.env.FRONTEND_URL);
      
      const invitationLink = `${frontendUrl}/complete-invitation?token=${invitationToken}`;
      console.log('🔗 [Invitation] Generated invitation link:', invitationLink);
      
      // Generate a hidden one-time password (not visible in email)
      const otp = this.generateOTP();
      
      const emailSubject = `You've been invited to join OTR Baseball Analytics`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background-color: #1a2340; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #1a2340; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .highlight { color: #1a2340; font-weight: bold; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 Welcome to OTR Baseball Analytics</h1>
            <p>You've been invited to join our platform!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            
            <p>You've been invited to join the <strong>OTR Baseball Analytics Platform</strong> as a player.</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This invitation link will expire in 7 days. Please complete your registration as soon as possible.
            </div>
            
            <h3>What you'll be able to do:</h3>
            <ul>
              <li>View your personal performance analytics</li>
              <li>Download detailed session reports</li>
              <li>Track your progress over time</li>
              <li>Access your player dashboard</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${invitationLink}" class="button">Complete Your Registration</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${invitationLink}">${invitationLink}</a>
            </p>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Click the registration link above</li>
              <li>Create your password</li>
              <li>Complete your profile</li>
              <li>Start exploring your analytics!</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by OTR Baseball Analytics Platform</p>
            <p>Visit us at: <a href="https://otr-data.com">https://otr-data.com</a></p>
            <p>From: otrdatatrack@gmail.com</p>
            <p style="font-size: 10px; color: #999;">
              This invitation expires on ${new Date(user.invitation_expires_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </body>
        </html>
      `;

      const emailText = `
Welcome to OTR Baseball Analytics!

Hello ${user.name}!

You've been invited to join the OTR Baseball Analytics Platform as a player.

⚠️ Important: This invitation link will expire in 7 days. Please complete your registration as soon as possible.

What you'll be able to do:
- View your personal performance analytics
- Download detailed session reports
- Track your progress over time
- Access your player dashboard

Complete your registration: ${invitationLink}

Next Steps:
1. Click the registration link above
2. Create your password
3. Complete your profile
4. Start exploring your analytics!

---
This invitation was sent by OTR Baseball Analytics Platform
Visit us at: https://otr-data.com
From: otrdatatrack@gmail.com

This invitation expires on ${new Date(user.invitation_expires_at).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
      `;

      // Send email
      const mailOptions = {
        from: `"OTR Baseball Analytics" <${process.env.EMAIL_USER || 'otrdatatrack@gmail.com'}>`,
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      };

      await this.emailService.transporter.sendMail(mailOptions);
      console.log(`✅ Invitation email sent successfully to ${user.email}`);
      
    } catch (error) {
      console.error('❌ Error sending invitation email:', error);
      // Don't throw error - just log it and continue
      // In production, you might want to queue the email for retry
      console.log('⚠️ Email sending failed, but invitation was created successfully');
    }
    
    // Store the original token (without OTP) for verification
    await user.update({ 
      invitation_token: invitationToken
    });
  }

  /**
   * Generate a one-time password
   */
  generateOTP() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Verify invitation token and get user
   */
  async verifyInvitationToken(token) {
    const user = await User.findOne({ 
      where: { 
        invitation_token: token,
        invitation_status: 'pending'
      }
    });

    if (!user) {
      throw new Error('Invalid or expired invitation token');
    }

    if (user.isInvitationExpired()) {
      await user.update({ invitation_status: 'expired' });
      throw new Error('Invitation has expired');
    }

    return user;
  }

  /**
   * Complete invitation by setting password
   */
  async completeInvitation(token, password) {
    const user = await this.verifyInvitationToken(token);

    // Update user with new password and mark invitation as accepted
    await user.update({
      password,
      invitation_status: 'accepted',
      invitation_token: null,
      invitation_expires_at: null
    });

    return {
      message: 'Invitation completed successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Get pending invitations for a coach/admin
   */
  async getPendingInvitations(inviterId) {
    const invitations = await User.findAll({
      where: {
        invited_by: inviterId,
        invitation_status: 'pending'
      },
      attributes: ['id', 'name', 'email', 'invitation_expires_at', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    return invitations;
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId, inviterId) {
    const invitation = await User.findOne({
      where: {
        id: invitationId,
        invited_by: inviterId,
        invitation_status: 'pending'
      }
    });

    if (!invitation) {
      throw new Error('Invitation not found or cannot be cancelled');
    }

    await invitation.destroy();
    return { message: 'Invitation cancelled successfully' };
  }
}

module.exports = InvitationService; 