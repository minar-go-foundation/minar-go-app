
'use server';

import nodemailer from 'nodemailer';

/**
 * Sends an OTP verification email using Gmail SMTP.
 * Using user provided credentials for absolute reliability.
 */
export async function sendOtpEmailAction(targetEmail: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kosttoonek7@gmail.com',
      pass: 'pxzj eidp fcpd apcm',
    },
  });

  const mailOptions = {
    from: '"Minar Go Foundation" <kosttoonek7@gmail.com>',
    to: targetEmail,
    subject: 'Verification Code - Minar Go Foundation',
    text: `Your account verification code is: ${otp}. Please use this code to complete your registration.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; background-color: #f9f9f9; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <h2 style="color: #002366; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Minar Go Foundation</h2>
          <p style="color: #C4A052; font-weight: bold; font-size: 14px; margin-bottom: 30px;">EXPATRIATE DEVELOPMENT FOUNDATION</p>
          
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Your account verification code is:</p>
          
          <div style="font-size: 42px; font-weight: 900; color: #002366; padding: 20px; background: #F8FAFF; display: inline-block; border-radius: 15px; margin: 20px 0; border: 2px solid #002366;">
            ${otp}
          </div>
          
          <p style="font-size: 14px; color: #888; margin-top: 30px;">Please use this code to complete your secure registration.</p>
          <p style="font-size: 12px; color: #bbb; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">
            © 2024 MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION.<br/>
            ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message };
  }
}
