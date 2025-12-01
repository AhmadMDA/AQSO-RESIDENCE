let nodemailer;
let transporter;

// Try to load nodemailer, but don't fail if it's not installed
try {
  nodemailer = require('nodemailer');
  
  // Email configuration
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
} catch (error) {
  console.warn('[Email Service] Nodemailer not installed. Email features disabled.');
  console.warn('[Email Service] Run: npm install nodemailer');
}

// Send confirmation email
async function sendConfirmationEmail(userEmail, userName, provider) {
  const mailOptions = {
    from: `"AQSO Residence" <${process.env.SMTP_USER || 'noreply@aqso.com'}>`,
    to: userEmail,
    subject: 'Login Confirmation - AQSO Residence',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #262b40; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { background-color: #262b40; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          .info-box { background-color: #e8f4f8; border-left: 4px solid #00A4EF; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AQSO Residence</h1>
          </div>
          <div class="content">
            <h2>Login Berhasil!</h2>
            <p>Halo ${userName || userEmail},</p>
            <p>Anda baru saja login ke AQSO Residence menggunakan ${provider}.</p>
            
            <div class="info-box">
              <strong>Detail Login:</strong><br>
              Email: ${userEmail}<br>
              Provider: ${provider}<br>
              Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            </div>
            
            <p>Jika ini bukan Anda, segera hubungi administrator.</p>
            
            <p>Terima kasih telah menggunakan AQSO Residence Dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AQSO Residence. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (!transporter) {
    console.log(`[Email Service] Would send confirmation email to ${userEmail} (nodemailer not installed)`);
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Confirmation email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error.message);
    return false;
  }
}

// Send registration confirmation email
async function sendRegistrationEmail(userEmail, userName, provider) {
  const mailOptions = {
    from: `"AQSO Residence" <${process.env.SMTP_USER || 'noreply@aqso.com'}>`,
    to: userEmail,
    subject: 'Selamat Datang di AQSO Residence',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #262b40; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .welcome-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AQSO Residence</h1>
          </div>
          <div class="content">
            <h2>Selamat Datang!</h2>
            <p>Halo ${userName || userEmail},</p>
            <p>Akun Anda telah berhasil dibuat menggunakan ${provider}.</p>
            
            <div class="welcome-box">
              <strong>Informasi Akun:</strong><br>
              Email: ${userEmail}<br>
              Provider: ${provider}<br>
              Tanggal Registrasi: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            </div>
            
            <p>Anda sekarang dapat mengakses dashboard AQSO Residence dengan akun ini.</p>
            
            <p>Terima kasih telah bergabung dengan kami!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AQSO Residence. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (!transporter) {
    console.log(`[Email Service] Would send registration email to ${userEmail} (nodemailer not installed)`);
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Registration email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error.message);
    return false;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendRegistrationEmail
};