
'use server';

import nodemailer from 'nodemailer';

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
    text: `Your account verification code is: ${otp}.`,
    html: `
      <div style="font-family: sans-serif; padding: 40px; color: #333; background-color: #f9f9f9; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px;">
          <h2 style="color: #002366;">Minar Go Foundation</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 42px; font-weight: bold; color: #002366; padding: 20px; background: #F8FAFF; border-radius: 15px; margin: 20px 0;">
            ${otp}
          </div>
          <p>© 2024 MINAR GO FOUNDATION.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
