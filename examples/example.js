const { ADKSalesforceConnector, ConfigManager } = require('../index');
require('dotenv').config();

/**
 * Example usage of ADK Salesforce Connector
 * This demonstrates the basic functionality of the connector
 */

async function runExample() {
    console.log('🚀 ADK Salesforce Connector Example');
    console.log('=====================================\n');

    try {
        // Initialize configuration manager
        console.log('📋 Loading configuration...');
        const configManager = new ConfigManager();
        const connectionConfig = configManager.getConnectionConfig();
        
        // Create connector instance
        const connector = new ADKSalesforceConnector(connectionConfig);
        
        // Set up event listeners
        connector.on('connected', (userInfo) => {
            console.log('✅ Successfully connected to Salesforce');
            console.log(`   User ID: ${userInfo.id}`);
            console.log(`   Organization ID: ${userInfo.organizationId}\n`);
        });
        
        connector.on('error', (error) => {
            console.error('❌ Error:', error.message);
        });
        
        connector.on('recordCreated', (event) => {
            console.log(`✅ Created ${event.type} record with ID: ${event.id}`);
        });
        
        connector.on('queryExecuted', (event) => {
            console.log(`📊 Query executed, returned ${event.recordCount} records`);
        });

        // Authenticate (you can also use OAuth)
        console.log('🔐 Authenticating with Salesforce...');
        try {
            const credentials = configManager.getCredentials();
            await connector.authenticate(credentials);
        } catch (authError) {
            console.log('⚠️  Username/password authentication failed, trying OAuth...');
            // In a real application, you would implement OAuth flow here
            console.log('💡 For OAuth authentication, implement the OAuth flow in your application');
            return;
        }
        
        // Get connection info
        console.log('📡 Connection Information:');
        const connInfo = connector.getConnectionInfo();
        console.log(`   Instance URL: ${connInfo.instanceUrl}`);
        console.log(`   API Version: ${connInfo.version}`);
        console.log(`   User ID: ${connInfo.userId}\n`);

        // Example 1: Query existing records
        console.log('📋 Querying Account records...');
        try {
            const accounts = await connector.query('SELECT Id, Name, Type FROM Account LIMIT 5');
            console.log(`   Found ${accounts.totalSize} accounts:`);
            accounts.records.forEach(account => {
                console.log(`   - ${account.Name} (${account.Type || 'No Type'})`);
            });
            console.log();
        } catch (queryError) {
            console.log('   No accounts found or insufficient permissions\n');
        }

        // Example 2: Create a new account (commented out to avoid creating test data)
        /*
        console.log('🆕 Creating a new Account...');
        const newAccount = await connector.create('Account', {
            Name: 'ADK Test Account',
            Type: 'Customer',
            Description: 'Created by ADK Salesforce Connector example'
        });
        console.log(`   Created account with ID: ${newAccount.id}\n`);
        
        // Example 3: Update the account
        console.log('📝 Updating the account...');
        await connector.update('Account', newAccount.id, {
            Phone: '+1-555-123-4567',
            Website: 'https://example.com'
        });
        console.log('   Account updated successfully\n');
        
        // Example 4: Retrieve the updated account
        console.log('📄 Retrieving the updated account...');
        const updatedAccount = await connector.retrieve('Account', newAccount.id, 'Id,Name,Phone,Website');
        console.log('   Retrieved account:', updatedAccount);
        console.log();
        
        // Example 5: Clean up - delete the test account
        console.log('🗑️  Deleting the test account...');
        await connector.delete('Account', newAccount.id);
        console.log('   Test account deleted\n');
        */

        // Example 6: Describe an object
        console.log('🔍 Describing Account object...');
        try {
            const accountDescription = await connector.describe('Account');
            console.log(`   Account object has ${accountDescription.fields.length} fields`);
            console.log(`   Key fields: ${accountDescription.fields.slice(0, 5).map(f => f.name).join(', ')}...\n`);
        } catch (describeError) {
            console.log('   Could not describe Account object\n');
        }

        // Example 7: Get organization limits
        console.log('📊 Getting organization limits...');
        try {
            const limits = await connector.getLimits();
            const apiCalls = limits.DailyApiRequests;
            console.log(`   Daily API Requests: ${apiCalls.Remaining}/${apiCalls.Max} remaining\n`);
        } catch (limitsError) {
            console.log('   Could not retrieve organization limits\n');
        }

        // Disconnect
        console.log('👋 Disconnecting from Salesforce...');
        await connector.disconnect();
        console.log('✅ Disconnected successfully');
        
    } catch (error) {
        console.error('❌ Example failed:', error.message);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    console.log('💡 To run this example, set the following environment variables:');
    console.log('   SF_USERNAME=your-salesforce-username');
    console.log('   SF_PASSWORD=your-salesforce-password');
    console.log('   SF_SECURITY_TOKEN=your-security-token (if required)');
    console.log('   SF_SANDBOX=true (if using sandbox)\n');
    
    runExample().catch(console.error);
}

module.exports = { runExample };