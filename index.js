const ADKSalesforceConnector = require('./lib/ADKSalesforceConnector');
const ConfigManager = require('./lib/ConfigManager');

/**
 * Main entry point for ADK Salesforce Connector
 * Exports the connector class and utilities for easy integration
 */

module.exports = {
    // Main connector class
    ADKSalesforceConnector,
    
    // Configuration management
    ConfigManager,
    
    // Convenience method to create a new connector instance
    createConnector: (config) => new ADKSalesforceConnector(config),
    
    // Version information
    version: require('./package.json').version
};