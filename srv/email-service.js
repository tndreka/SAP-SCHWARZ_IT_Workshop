require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendDownloadTokenEmail(recipientEmail, downloadToken, supplierID) {
    try {
        const downloadUrl = `${process.env.APP_URL}/company.html`;
        
        const mailOptions = {
            from: `"Shipment System" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: `Document Ready for Download - Supplier ${supplierID}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">📦 Document Ready for Download</h2>
                    <p>A document has been uploaded by Supplier <strong>${supplierID}</strong> and is ready for download.</p>
                    
                    <div style="background: #2d3748; color: #68d391; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: monospace;">
                        <strong style="color: #fff;">Your Download Token:</strong><br><br>
                        <span style="font-size: 14px; word-break: break-all;">${downloadToken}</span>
                    </div>
                    
                    <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>To download the document:</strong></p>
                        <ol>
                            <li>Go to: <a href="${downloadUrl}" style="color: #667eea;">${downloadUrl}</a></li>
                            <li>Enter the token above</li>
                            <li>Click "Retrieve Document"</li>
                            <li>Download the file</li>
                        </ol>
                    </div>
                    
                    <p style="color: #718096; font-size: 12px;">
                        <strong>Note:</strong> This token is valid for 7 days and can be used up to 5 times.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(` Email sent successfully: ${info.messageId}`);
        console.log(`   To: ${recipientEmail}`);
        return true;
        
    } catch (error) {
        console.error(' Failed to send email:', error.message);
        if (error.response) {
            console.error('   SMTP Response:', error.response);
        }
        return false;
    }
}

async function sendReceiptConfirmationEmail(supplierID, recipientEmail, documentName) {
    try {
        // Note: In production, you'd send this to the supplier's email
        // For now, we'll just log it since we don't store supplier email
        const mailOptions = {
            from: `"Shipment System" <${process.env.SMTP_USER}>`,
            to: recipientEmail, // TODO: Change to supplier email when available
            subject: `Document Receipt Confirmed - ${documentName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #38a169;">✅ Document Receipt Confirmed</h2>
                    <p>Your document <strong>"${documentName}"</strong> has been successfully received.</p>
                    
                    <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Details:</strong></p>
                        <ul>
                            <li><strong>Supplier ID:</strong> ${supplierID}</li>
                            <li><strong>Document:</strong> ${documentName}</li>
                            <li><strong>Received by:</strong> ${recipientEmail}</li>
                            <li><strong>Confirmed at:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                    
                    <p style="color: #718096; font-size: 12px;">
                        This is an automated confirmation from the Shipment Document System.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(` Confirmation email sent: ${info.messageId}`);
        return true;
        
    } catch (error) {
        console.error(' Failed to send confirmation email:', error.message);
        return false;
    }
}

// Test connection on module load
transporter.verify(function (error, success) {
    if (error) {
        console.error(' SMTP Connection Error:', error.message);
        console.log('   Please check your .env file settings');
    } else {
        console.log(' SMTP Server is ready to send emails');
    }
});

module.exports = {
    sendDownloadTokenEmail,
    sendReceiptConfirmationEmail
};