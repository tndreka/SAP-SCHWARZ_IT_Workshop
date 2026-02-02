const fs = require('fs').promises;
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '..', 'app', 'storage');

async function ensureStorageDirectory() {
    try {
        await fs.mkdir(STORAGE_ROOT, { recursive: true });
    } catch (error) {
        console.error('Error creating storage directory:', error);
    }
}

async function storeDocument(shipmentID, filename, base64Content) {
    await ensureStorageDirectory();
    
    const shipmentDir = path.join(STORAGE_ROOT, shipmentID);
    await fs.mkdir(shipmentDir, { recursive: true });
    
    const filePath = path.join(shipmentDir, filename);
    const buffer = Buffer.from(base64Content, 'base64');
    
    await fs.writeFile(filePath, buffer);
    
    return filePath;
}

async function retrieveDocument(shipmentID, filename) {
    const filePath = path.join(STORAGE_ROOT, shipmentID, filename);
    
    try {
        const buffer = await fs.readFile(filePath);
        return buffer.toString('base64');
    } catch (error) {
        console.error('Error reading file:', error);
        throw new Error('Document not found');
    }
}

module.exports = {
    storeDocument,
    retrieveDocument
};