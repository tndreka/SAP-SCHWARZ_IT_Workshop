using { com.sap.workshop.shipment as db } from '../db/schema';

service ShipmentService {
    
    // Read-only access to shipments (for internal use)
    entity ShipmentDocuments as projection on db.ShipmentDocuments;
    entity ShipmentItems as projection on db.ShipmentItems;
    
    // ===== SUPPLIER ACTIONS (Anonymous) =====
    
    // Step 1: Supplier requests upload token
    action generateUploadToken() returns {
        token: String;
        uploadUrl: String;
        expiresAt: DateTime;
        message: String;
    };
    
    // Step 2: Supplier uploads shipment document + details
    action uploadShipment(
        token: String,
        
        // Supplier info
        supplierName: String,
        supplierEmail: String,
        supplierPhone: String,
        
        // Shipment info
        shipmentNumber: String,
        shipmentDate: Date,
        expectedDeliveryDate: Date,
        
        // Document
        documentName: String,
        documentContent: LargeBinary,
        
        // Items array (JSON string for simplicity)
        items: String // JSON: [{itemNumber, description, quantity, unit, value}]
        
    ) returns {
        shipmentID: UUID;
        downloadToken: String;
        downloadUrl: String;
        message: String;
    };
    
    // ===== COMPANY ACTIONS (Anonymous) =====
    
    // Step 3: Company downloads shipment document
    action downloadShipment(token: String) returns {
        shipmentID: UUID;
        supplierName: String;
        shipmentNumber: String;
        shipmentDate: Date;
        documentName: String;
        documentContent: LargeBinary;
        items: array of {
            itemNumber: String;
            itemDescription: String;
            quantity: Integer;
            unit: String;
            value: Decimal;
            currency: String;
        };
    };
    
    // Step 4: Company confirms receipt
    action confirmShipment(token: String) returns {
        success: Boolean;
        message: String;
    };
    
    // ===== UTILITY ACTIONS =====
    
    // Check token validity
    function checkToken(token: String) returns {
        valid: Boolean;
        type: String; // UPLOAD or DOWNLOAD
        expiresAt: DateTime;
    };
}