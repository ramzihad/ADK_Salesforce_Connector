const { ADKSalesforceConnector, ConfigManager } = require('../index');

/**
 * Basic tests for ADK Salesforce Connector
 * Note: These are unit tests that don't require actual Salesforce connection
 */

async function runTests() {
    console.log('🧪 Running ADK Salesforce Connector Tests');
    console.log('==========================================\n');

    let passedTests = 0;
    let totalTests = 0;

    async function test(description, testFunction) {
        totalTests++;
        console.log(`🔍 Testing: ${description}`);
        
        try {
            const result = await testFunction();
            if (result === true || (typeof result === 'object' && result.success)) {
                console.log('✅ PASSED\n');
                passedTests++;
            } else {
                console.log('❌ FAILED: Test did not return true or success object\n');
            }
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}\n`);
        }
    }

    // Test 1: Connector instantiation
    await test('Connector instantiation with default config', () => {
        const connector = new ADKSalesforceConnector();
        return connector instanceof ADKSalesforceConnector &&
               connector.config.loginUrl === 'https://login.salesforce.com' &&
               connector.config.version === '59.0';
    });

    // Test 2: Connector instantiation with custom config
    await test('Connector instantiation with custom config', () => {
        const customConfig = {
            loginUrl: 'https://test.salesforce.com',
            version: '58.0',
            timeout: 30000
        };
        const connector = new ADKSalesforceConnector(customConfig);
        return connector.config.loginUrl === 'https://test.salesforce.com' &&
               connector.config.version === '58.0' &&
               connector.config.timeout === 30000;
    });

    // Test 3: Initial connection state
    await test('Initial connection state should be disconnected', () => {
        const connector = new ADKSalesforceConnector();
        return !connector.isConnectionActive() && 
               !connector.isConnected &&
               connector.connection === null;
    });

    // Test 4: ConfigManager instantiation
    await test('ConfigManager instantiation', () => {
        const configManager = new ConfigManager();
        return configManager instanceof ConfigManager;
    });

    // Test 5: ConfigManager environment loading
    await test('ConfigManager loads from environment variables', () => {
        // Set test environment variables
        process.env.SF_USERNAME = 'test@example.com';
        process.env.SF_LOGIN_URL = 'https://test.salesforce.com';
        
        const configManager = new ConfigManager();
        const config = configManager.getConfig();
        
        // Clean up
        delete process.env.SF_USERNAME;
        delete process.env.SF_LOGIN_URL;
        
        return config.username === 'test@example.com' &&
               config.loginUrl === 'https://test.salesforce.com';
    });

    // Test 6: ConfigManager sandbox configuration
    await test('ConfigManager sandbox URL configuration', () => {
        // Set sandbox environment
        process.env.SF_SANDBOX = 'true';
        
        const configManager = new ConfigManager();
        const config = configManager.getConfig();
        
        // Clean up
        delete process.env.SF_SANDBOX;
        
        return config.sandbox === true &&
               config.loginUrl === 'https://test.salesforce.com';
    });

    // Test 7: Connection info when not connected
    await test('Connection info returns null when not connected', () => {
        const connector = new ADKSalesforceConnector();
        return connector.getConnectionInfo() === null;
    });

    // Test 8: Error handling for operations without connection
    await test('Operations throw error when not connected', () => {
        const connector = new ADKSalesforceConnector();
        
        try {
            // This should throw an error
            connector._ensureConnected();
            return false; // Should not reach here
        } catch (error) {
            return error.message === 'Not connected to Salesforce. Please authenticate first.';
        }
    });

    // Test 9: Event emitter functionality
    await test('Connector extends EventEmitter', () => {
        const connector = new ADKSalesforceConnector();
        let eventFired = false;
        
        connector.on('test', () => {
            eventFired = true;
        });
        
        connector.emit('test');
        return eventFired === true;
    });

    // Test 10: ConfigManager validation
    await test('ConfigManager validation catches missing credentials', () => {
        const configManager = new ConfigManager();
        
        try {
            configManager.validate();
            return false; // Should throw error
        } catch (error) {
            return error.message.includes('Either username/password or OAuth credentials');
        }
    });

    // Test 11: Authentication parameter validation
    await test('Authentication validates required parameters', async () => {
        const connector = new ADKSalesforceConnector();
        
        try {
            await connector.authenticate({});
            return false; // Should throw error
        } catch (error) {
            return error.message.includes('Username and password are required');
        }
    });

    // Test 12: OAuth authentication parameter validation
    await test('OAuth authentication validates required parameters', async () => {
        const connector = new ADKSalesforceConnector();
        
        try {
            await connector.authenticateOAuth({});
            return false; // Should throw error
        } catch (error) {
            return error.message.includes('OAuth configuration incomplete');
        }
    });

    // Test 13: Module exports
    await test('Module exports all required components', () => {
        const module = require('../index');
        return typeof module.ADKSalesforceConnector === 'function' &&
               typeof module.ConfigManager === 'function' &&
               typeof module.createConnector === 'function' &&
               typeof module.version === 'string';
    });

    // Test 14: createConnector convenience method
    await test('createConnector convenience method works', () => {
        const { createConnector } = require('../index');
        const connector = createConnector({ version: '58.0' });
        return connector instanceof ADKSalesforceConnector &&
               connector.config.version === '58.0';
    });

    // Test 15: Package version is accessible
    await test('Package version is accessible', () => {
        const { version } = require('../index');
        const packageVersion = require('../package.json').version;
        return version === packageVersion;
    });

    // Print results
    console.log('📊 Test Results:');
    console.log(`   Passed: ${passedTests}/${totalTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed!');
        return true;
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
        return false;
    }
}

module.exports = { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}