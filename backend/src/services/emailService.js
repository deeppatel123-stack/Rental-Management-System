import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


const transporter = nodemailer.createTransport(
    process.env.EMAIL_HOST
        ? {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || ''
            }
        }
        : {
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || ''
            }
        }
);

export const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Rental Management System" <noreply@rental.com>',
        to,
        subject,
        html
    };

    // Always log OTP context to node terminal console for local debugging
    const code = html.match(/\d{6}/)?.[0] || 'N/A';
    console.log(`✉️ [EMAIL SENT OUT] To: ${to} | Subject: ${subject} | VERIFICATION OTP CODE: ${code}`);

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER.startsWith('demo')) {
            console.log(`✉️ [MOCK EMAIL] Body: ${html.replace(/<[^>]*>/g, ' ')}`);
            return { msg: 'Email mocked successfully (credentials not set)' };
        }
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`🚨 Failed to send email: ${error.message}`);

        return { error: error.message };
    }
};
