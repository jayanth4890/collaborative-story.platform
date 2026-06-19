const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer transporter.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Warning: EMAIL_USER and EMAIL_PASS environment variables are not set. Emails will not be sent.');
    return null;
  }

  // Common default configuration for Gmail.
  // Can be adjusted in production (using SMTP credentials)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Generic email sending function.
 * Wraps transport setup and error handling.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SIMULATED]: To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const mailOptions = {
      from: `"ScribbleCollab" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email delivery failure to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Common HTML base template wrapper.
 */
const getBaseTemplate = (title, bodyContent, actionUrl, actionText) => {
  const buttonHtml = actionUrl && actionText ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${actionUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); font-size: 14px;">
        ${actionText}
      </a>
    </div>
  ` : '';

  const fallbackLinkHtml = actionUrl ? `
    <p style="font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; word-break: break-all;">
      If you're having trouble with the button, copy and paste this URL into your web browser:<br>
      <a href="${actionUrl}" target="_blank" style="color: #818cf8; text-decoration: underline;">${actionUrl}</a>
    </p>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, sans-serif; background-color: #020617; color: #f1f5f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #1e1b4b; text-align: center; border-bottom: 1px solid #312e81;">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ScribbleCollab</span>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; line-height: 1.6; color: #cbd5e1; font-size: 15px;">
                    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">${title}</h2>
                    ${bodyContent}
                    ${buttonHtml}
                    ${fallbackLinkHtml}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #475569;">
                    <p style="margin: 0;">&copy; 2026 ScribbleCollab. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0;">Collaborative Story Writing Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/**
 * Generates and sends contributor invitation email.
 */
const sendInvitationEmail = async ({ inviteeEmail, inviteeName, authorName, storyTitle, storyDesc, storyId }) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
  const body = `
    <p style="margin-bottom: 15px;">Hello <strong>${inviteeName}</strong>,</p>
    <p style="margin-bottom: 20px;"><strong>${authorName}</strong> has invited you to collaborate as a co-writer on their story: <strong>"${storyTitle}"</strong>.</p>
    <div style="background-color: #020617; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-style: italic; color: #94a3b8;">
      <strong>Premise:</strong><br>
      ${storyDesc}
    </div>
    <p style="margin-bottom: 15px;">Join the collaboration on your dashboard to write paragraphs, submit chapters, and bring this story to life!</p>
  `;
  const html = getBaseTemplate('Collaboration Invitation', body, actionUrl, 'View Invitation');
  return sendEmail({
    to: inviteeEmail,
    subject: `You have been invited to collaborate on "${storyTitle}"`,
    html,
  });
};

/**
 * Generates and sends invitation accepted email to author.
 */
const sendInvitationAcceptedEmail = async ({ authorEmail, authorName, inviteeName, storyTitle, storyId }) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/story/${storyId}`;
  const body = `
    <p style="margin-bottom: 15px;">Hello <strong>${authorName}</strong>,</p>
    <p style="margin-bottom: 20px;">Great news! <strong>${inviteeName}</strong> has accepted your invitation to join as a collaborator on your story: <strong>"${storyTitle}"</strong>.</p>
    <p style="margin-bottom: 15px;">They can now draft and submit new sections to your story pages. Head over to the workspace to manage contributors and review submissions.</p>
  `;
  const html = getBaseTemplate('Invitation Accepted', body, actionUrl, 'Go to Workspace');
  return sendEmail({
    to: authorEmail,
    subject: `${inviteeName} accepted your invitation!`,
    html,
  });
};

/**
 * Generates and sends contribution approved email to contributor.
 */
const sendContributionApprovedEmail = async ({ contributorEmail, contributorName, storyTitle, feedback, storyId }) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/story/${storyId}`;
  
  const feedbackHtml = feedback ? `
    <div style="background-color: #020617; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; color: #94a3b8; font-style: italic;">
      <strong>Author Feedback:</strong><br>
      "${feedback}"
    </div>
  ` : '';

  const body = `
    <p style="margin-bottom: 15px;">Hello <strong>${contributorName}</strong>,</p>
    <p style="margin-bottom: 20px;">Your draft submission for the story <strong>"${storyTitle}"</strong> has been <strong>approved</strong> by the author!</p>
    <p style="margin-bottom: 15px;">Your content has been appended to the official story pages. Thank you for helping build this tale.</p>
    ${feedbackHtml}
  `;
  const html = getBaseTemplate('Contribution Approved!', body, actionUrl, 'Read Updated Story');
  return sendEmail({
    to: contributorEmail,
    subject: `Your contribution for "${storyTitle}" was approved!`,
    html,
  });
};

/**
 * Generates and sends contribution rejected/declined email to contributor.
 */
const sendContributionRejectedEmail = async ({ contributorEmail, contributorName, storyTitle, feedback, storyId }) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/story/${storyId}`;
  
  const feedbackHtml = feedback ? `
    <div style="background-color: #020617; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; color: #94a3b8; font-style: italic;">
      <strong>Author Feedback / Details:</strong><br>
      "${feedback}"
    </div>
  ` : '<p style="margin-top: 15px; font-style: italic; color: #64748b;">No review notes were provided by the author.</p>';

  const body = `
    <p style="margin-bottom: 15px;">Hello <strong>${contributorName}</strong>,</p>
    <p style="margin-bottom: 20px;">Your draft submission for the story <strong>"${storyTitle}"</strong> has been reviewed and <strong>declined</strong> by the author.</p>
    <p style="margin-bottom: 15px;">Collaborative writing is an iterative process. You can read the review feedback below and submit a revised draft in the workspace.</p>
    ${feedbackHtml}
  `;
  const html = getBaseTemplate('Contribution Reviewed', body, actionUrl, 'Go to Workspace');
  return sendEmail({
    to: contributorEmail,
    subject: `Your contribution for "${storyTitle}" was reviewed`,
    html,
  });
};

/**
 * Generates and sends story completed email to all contributors.
 */
const sendStoryCompletedEmail = async ({ contributorEmail, contributorName, authorName, storyTitle, storyId }) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/story/${storyId}`;
  const body = `
    <p style="margin-bottom: 15px;">Hello <strong>${contributorName}</strong>,</p>
    <p style="margin-bottom: 20px;">The story <strong>"${storyTitle}"</strong>, which you collaborated on, has been marked <strong>completed</strong> by <strong>${authorName}</strong>!</p>
    <p style="margin-bottom: 15px;">The manuscript is now locked and ready to read. You can view the final work or download it as a formatted PDF in the workspace.</p>
    <p style="margin-bottom: 15px;">Thank you for your excellent contributions to this creative collaboration!</p>
  `;
  const html = getBaseTemplate('Story Completed!', body, actionUrl, 'View Final Story');
  return sendEmail({
    to: contributorEmail,
    subject: `The story "${storyTitle}" is now complete!`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendInvitationAcceptedEmail,
  sendContributionApprovedEmail,
  sendContributionRejectedEmail,
  sendStoryCompletedEmail,
};
