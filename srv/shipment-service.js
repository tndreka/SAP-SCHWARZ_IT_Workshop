const cds = require('@sap/cds');
const crypto = require('crypto');
const { storeDocument, retrieveDocument } = require('./file-storage');

module.exports = cds.service.impl(async function() {
    
    const { ShipmentDocuments, ShipmentItems } = this.entities;
    
    // ===== SUPPLIER: Generate Upload Token =====
    this.on('generateUploadToken', async (req) => {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes for testing
        
        const db = await cds.connect.to('db');
        
        await db.run(INSERT.into('com.sap.workshop.shipment.UploadTokens').entries({
            token: token,
            createdAt: new Date(),
            expiresAt: expiresAt,
            used: false,
            ipAddress: req.http?.req?.ip || 'unknown'
        }));
        
        return {
            token: token,
            uploadUrl: `/shipment/upload/${token}`,
            expiresAt: expiresAt,
            message: 'Token generated. Valid for 5 minutes.'
        };
    });
    
    // ===== SUPPLIER: Upload Shipment =====
    this.on('uploadShipment', async (req) => {
        const { token, supplierName, supplierEmail, supplierPhone, 
                shipmentNumber, shipmentDate, expectedDeliveryDate,
                documentName, documentContent, items } = req.data;
        
        const db = await cds.connect.to('db');
        
        // 1. Verify token
        const tokenRecord = await db.run(
            SELECT.one.from('com.sap.workshop.shipment.UploadTokens')
                .where({ token: token, used: false })
                .and('expiresAt >', new Date())
        );
            
        if (!tokenRecord) {
            return req.reject(403, 'Invalid or expired upload token');
        }
        
        // 2. Parse items
        let itemsArray = [];
        try {
            itemsArray = JSON.parse(items);
        } catch (e) {
            return req.reject(400, 'Invalid items format');
        }
        
        // 3. Create shipment document
        const shipmentID = cds.utils.uuid();
        
        // 4. Store the actual file
        const storagePath = await storeDocument(shipmentID, documentName, documentContent);
        
        await INSERT.into(ShipmentDocuments).entries({
            ID: shipmentID,
            supplierName: supplierName,
            supplierEmail: supplierEmail,
            supplierPhone: supplierPhone,
            shipmentNumber: shipmentNumber,
            shipmentDate: shipmentDate,
            expectedDeliveryDate: expectedDeliveryDate,
            totalItems: itemsArray.length,
            totalQuantity: itemsArray.reduce((sum, item) => sum + (item.quantity || 0), 0),
            documentName: documentName,
            documentSize: Buffer.from(documentContent, 'base64').length,
            mimeType: getMimeType(documentName),
            storagePath: storagePath,
            uploadedAt: new Date(),
            status: 'PENDING'
        });
        
        // 5. Create shipment items
        for (const item of itemsArray) {
            await INSERT.into(ShipmentItems).entries({
                ID: cds.utils.uuid(),
                shipment_ID: shipmentID,
                itemNumber: item.itemNumber,
                itemDescription: item.description,
                quantity: item.quantity,
                unit: item.unit,
                value: item.value,
                currency_code: item.currency || 'EUR'
            });
        }
        
        // 6. Mark upload token as used
        await db.run(
            UPDATE('com.sap.workshop.shipment.UploadTokens')
                .set({ used: true, shipmentID: shipmentID })
                .where({ token: token })
        );
        
        // 7. Generate download token for company
        const downloadToken = crypto.randomBytes(32).toString('hex');
        const downloadExpiresAt = new Date(Date.now() + 30 * 24 * 3600000); // 30 days
        
        await db.run(INSERT.into('com.sap.workshop.shipment.DownloadTokens').entries({
            token: downloadToken,
            shipment_ID: shipmentID,
            createdAt: new Date(),
            expiresAt: downloadExpiresAt,
            downloadCount: 0,
            maxDownloads: 5,
            ipAddress: req.http?.req?.ip || 'unknown'
        }));
        
        return {
            shipmentID: shipmentID,
            downloadToken: downloadToken,
            downloadUrl: `/shipment/download/${downloadToken}`,
            message: `Shipment ${shipmentNumber} uploaded successfully. Real file stored!`
        };
    });
    
    // ===== COMPANY: Download Shipment =====
    this.on('downloadShipment', async (req) => {
        const { token } = req.data;
        
        const db = await cds.connect.to('db');
        
        // 1. Verify download token
        const tokenRecord = await db.run(
            SELECT.one.from('com.sap.workshop.shipment.DownloadTokens')
                .where({ token: token })
                .and('expiresAt >', new Date())
        );
            
        if (!tokenRecord || tokenRecord.downloadCount >= tokenRecord.maxDownloads) {
            return req.reject(403, 'Invalid, expired, or maximum downloads reached');
        }
        
        // 2. Get shipment document
        const shipment = await SELECT.one.from(ShipmentDocuments)
            .where({ ID: tokenRecord.shipment_ID });
            
        if (!shipment) {
            return req.reject(404, 'Shipment not found');
        }
        
        // 3. Get shipment items
        const items = await SELECT.from(ShipmentItems)
            .where({ shipment_ID: shipment.ID });
        
        // 4. Retrieve the actual document file
        const documentContent = await retrieveDocument(shipment.ID, shipment.documentName);
        
        // 5. Update download count and timestamp
        await db.run(
            UPDATE('com.sap.workshop.shipment.DownloadTokens')
                .set({ downloadCount: tokenRecord.downloadCount + 1 })
                .where({ token: token })
        );
            
        await UPDATE(ShipmentDocuments)
            .set({ 
                downloadedAt: new Date(),
                status: 'DOWNLOADED'
            })
            .where({ ID: shipment.ID });
        
        return {
            shipmentID: shipment.ID,
            supplierName: shipment.supplierName,
            shipmentNumber: shipment.shipmentNumber,
            shipmentDate: shipment.shipmentDate,
            documentName: shipment.documentName,
            documentContent: documentContent,
            items: items.map(item => ({
                itemNumber: item.itemNumber,
                itemDescription: item.itemDescription,
                quantity: item.quantity,
                unit: item.unit,
                value: item.value,
                currency: item.currency_code
            }))
        };
    });
    
    // ===== COMPANY: Confirm Shipment =====
    this.on('confirmShipment', async (req) => {
        const { token } = req.data;
        
        const db = await cds.connect.to('db');
        
        const tokenRecord = await db.run(
            SELECT.one.from('com.sap.workshop.shipment.DownloadTokens')
                .where({ token: token })
        );
            
        if (!tokenRecord) {
            return req.reject(403, 'Invalid token');
        }
        
        await UPDATE(ShipmentDocuments)
            .set({ status: 'CONFIRMED' })
            .where({ ID: tokenRecord.shipment_ID });
        
        return {
            success: true,
            message: 'Shipment confirmed successfully'
        };
    });
    
    // ===== UTILITY: Check Token =====
    this.on('checkToken', async (req) => {
        const { token } = req.data;
        
        const db = await cds.connect.to('db');
        
        // Check if upload token
        let tokenRecord = await db.run(
            SELECT.one.from('com.sap.workshop.shipment.UploadTokens')
                .where({ token: token })
        );
            
        if (tokenRecord) {
            return {
                valid: !tokenRecord.used && new Date(tokenRecord.expiresAt) > new Date(),
                type: 'UPLOAD',
                expiresAt: tokenRecord.expiresAt
            };
        }
        
        // Check if download token
        tokenRecord = await db.run(
            SELECT.one.from('com.sap.workshop.shipment.DownloadTokens')
                .where({ token: token })
        );
            
        if (tokenRecord) {
            return {
                valid: new Date(tokenRecord.expiresAt) > new Date() && 
                       tokenRecord.downloadCount < tokenRecord.maxDownloads,
                type: 'DOWNLOAD',
                expiresAt: tokenRecord.expiresAt
            };
        }
        
        return { valid: false, type: 'UNKNOWN', expiresAt: null };
    });
    
    // Helper function
    function getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'csv': 'text/csv',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return types[ext] || 'application/octet-stream';
    }
});