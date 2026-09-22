export function generateOtpEmailHtml(otp: string, purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN'): string {
  let title = 'Verify Your Financial Flow Account';
  let subtitle = 'Use the secure 6-digit verification code below to activate your Financial Flow workspace.';

  if (purpose === 'LOGIN') {
    title = 'Financial Flow Login Verification';
    subtitle = 'A login attempt requires verification. Enter the 6-digit one-time passcode below to authenticate your session.';
  } else if (purpose === 'PASSWORD_RESET') {
    title = 'Reset Your Financial Flow Password';
    subtitle = 'Use the secure 6-digit code below to confirm and finalize your password reset.';
  }


  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%); padding: 32px 40px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 38px; height: 38px; line-height: 38px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; text-align: center; color: #ffffff; font-weight: 800; font-size: 20px;">F</div>
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-left: 12px; vertical-align: middle;">Financial Flow</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">AI-Powered Personal Finance Intelligence</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px 30px 40px;">
              <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">${title}</h1>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">${subtitle}</p>
              
              <!-- OTP Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #030712; border: 1px solid #2563eb; border-radius: 14px; padding: 24px;">
                    <span style="display: block; color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">One-Time Security Code</span>
                    <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">${otp}</span>
                    <span style="display: block; color: #94a3b8; font-size: 12px; margin-top: 10px;">Valid for <strong>10 minutes</strong></span>
                  </td>
                </tr>
              </table>

              <!-- Security Information -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="color: #cbd5e1; font-size: 12px; line-height: 1.5;">
                    🛡️ <strong>Security Advisory:</strong> Never share this code with anyone. Financial Flow will never ask for your verification code.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not initiate this request, you can safely ignore this email or review your account security.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #090d16; border-top: 1px solid #1e293b; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 500;">
                Financial Flow Enterprise Security Layer &bull; AES-256-GCM &bull; Argon2id
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Financial Flow. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
