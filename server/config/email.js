const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Verify your TableToken account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: #111827; padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: -0.5px;">🍽️ TableToken</h1>
          <p style="color: rgba(255,255,255,0.5); margin: 6px 0 0; font-size: 13px;">Order smart. Eat happy.</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 10px;">Hi ${name}! 👋</h2>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Thanks for signing up. Please verify your email address to activate your account and start ordering.
          </p>

          <!-- Button -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${verifyUrl}"
              style="background: #e63946; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              ✅ Verify Email Address
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 8px;">
            Or copy this link into your browser:
          </p>
          <p style="color: #e63946; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px;">
            ${verifyUrl}
          </p>

          <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
            <p style="color: #92400e; font-size: 12px; margin: 0;">
              ⚠️ This link expires in <strong>24 hours</strong>. If you did not create an account, ignore this email.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">© 2025 TableToken · All rights reserved</p>
        </div>
      </div>
    `,
  });
};

const sendForgotPasswordEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Reset your TableToken password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        
        <div style="background: #111827; padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🍽️ TableToken</h1>
          <p style="color: rgba(255,255,255,0.5); margin: 6px 0 0; font-size: 13px;">Order smart. Eat happy.</p>
        </div>

        <div style="padding: 32px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 10px;">Hi ${name}! 👋</h2>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}"
              style="background: #e63946; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              🔑 Reset Password
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 8px;">
            Or copy this link:
          </p>
          <p style="color: #e63946; font-size: 12px; text-align: center; word-break: break-all; margin: 0 0 24px;">
            ${resetUrl}
          </p>

          <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
            <p style="color: #92400e; font-size: 12px; margin: 0;">
              ⚠️ This link expires in <strong>1 hour</strong>. If you did not request a password reset, ignore this email.
            </p>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">© 2025 TableToken · All rights reserved</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendForgotPasswordEmail };