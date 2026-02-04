require('dotenv').config();
const { sendDownloadTokenEmail } = require('./srv/email-service');

console.log('Testing email configuration...');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);

sendDownloadTokenEmail(
    process.env.SMTP_USER, // Send to yourself for testing
    'TEST-TOKEN-ABC123XYZ789',
    'SUP-TEST-001'
).then(success => {
    if (success) {
        console.log('\n🎉 Test email sent successfully!');
        console.log('Check your inbox:', process.env.SMTP_USER);
    } else {
        console.log('\n❌ Test email failed. Check the errors above.');
    }
    process.exit(0);
});
