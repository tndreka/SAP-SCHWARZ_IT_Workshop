namespace com.sap.workshop.shipment;

using { Currency, cuid, managed } from '@sap/cds/common';

// Shipment document with inventory details
entity ShipmentDocuments : managed {
    key ID: UUID;
    
    // Supplier info (no account needed)
    supplierName: String(200);
    supplierEmail: String(200);
    supplierPhone: String(50);
    
    // Shipment details
    shipmentNumber: String(100);
    shipmentDate: Date;
    expectedDeliveryDate: Date;
    totalItems: Integer;
    totalQuantity: Integer;
    
    // Document info
    documentName: String(255);
    documentSize: Integer;
    mimeType: String(100);
    storagePath: String(500);
    
    // Timestamps
    downloadedAt: DateTime;
    status: String(20) default 'PENDING';
    
    // Relations
    items: Composition of many ShipmentItems on items.shipment = $self;
}

// Inventory items in the shipment
entity ShipmentItems : cuid {
    shipment: Association to ShipmentDocuments;
    
    itemNumber: String(50);
    itemDescription: String(500);
    quantity: Integer;
    unit: String(20);
    value: Decimal(15,2);
    currency: Currency;
}

// Anonymous upload tokens for suppliers
entity UploadTokens {
    key token: String(64);
    createdAt: DateTime;
    expiresAt: DateTime;
    used: Boolean default false;
    shipmentID: UUID;
    ipAddress: String(50);
}

// Anonymous download tokens for company
entity DownloadTokens {
    key token: String(64);
    shipment: Association to ShipmentDocuments;
    createdAt: DateTime;
    expiresAt: DateTime;
    downloadCount: Integer default 0;
    maxDownloads: Integer default 5;
    ipAddress: String(50);
}