using { com.sap.workshop.shipment as db } from '../db/schema';

service ShipmentService {
    
    // Read-only access to shipments (for internal use)
    entity ShipmentDocuments as projection on db.ShipmentDocuments;
    
    // ===== SUPPLIER ACTIONS (Anonymous) =====
    
    // Step 1: Supplier requests upload token
    action generateUploadToken() returns {
        token: String;
        uploadUrl: String;
        expiresAt: DateTime;
        message: String;
    };
    
    // Step 2: Supplier uploads document (simplified)
    action uploadDocument(
        token: String,
        supplierID: String,
        recipientEmail: String,
        documentName: String,
        documentContent: LargeBinary
    ) returns {
        success: Boolean;
        message: String;
        downloadToken: String;
        emailSent: Boolean;
    };
    
    // ===== COMPANY ACTIONS (Anonymous) =====
    
    // Step 1: Company retrieves document info using token
    action retrieveDocument(token: String) returns {
        shipmentID: UUID;
        supplierID: String;
        documentName: String;
        documentSize: Integer;
        mimeType: String;
        status: String;
        createdAt: DateTime;
    };
    
    // Step 2: Company downloads the actual document
    action downloadDocument(token: String) returns LargeBinary;
    
    // Step 3: Company confirms receipt
    action confirmReceipt(token: String) returns {
        success: Boolean;
        message: String;
        receivedAt: DateTime;
    };
}