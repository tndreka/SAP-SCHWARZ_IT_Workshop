const fs = require('fs').promises;
const path = require('path');

// Storage directory (adjust as needed)
const STORAGE_DIR = path.join(__dirname, '../uploads');

// Ensure storage directory exists
async function ensureStorageDir() {
    try {
        await fs.access(STORAGE_DIR);
    } catch {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
}

// Store document
async function storeDocument(shipmentID, filename, buffer) {
    await ensureStorageDir();
    
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = path.join(STORAGE_DIR, `${shipmentID}_${sanitizedFilename}`);
    
    await fs.writeFile(storagePath, buffer);
    
    return storagePath;
}

// Retrieve document
async function retrieveDocument(storagePath) {
    try {
        const buffer = await fs.readFile(storagePath);
        return buffer;
    } catch (error) {
        throw new Error(`Failed to retrieve document: ${error.message}`);
    }
}

module.exports = {
    storeDocument,
    retrieveDocument
};