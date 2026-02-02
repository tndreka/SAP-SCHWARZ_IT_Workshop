const cds = require('@sap/cds');

cds.on('bootstrap', (app) => {
    const express = require('express');
    
    // Increase body size limit BEFORE any routes are defined
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.use(express.text({ limit: '100mb', type: '*/*' }));
    
    console.log('✅ Custom body-parser limits applied: 100MB');
});

module.exports = cds.server;
