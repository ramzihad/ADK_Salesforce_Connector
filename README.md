# ADK Salesforce Connector

A comprehensive and easy-to-use Salesforce connector for Node.js applications. This connector provides a clean, event-driven API for integrating with Salesforce's REST APIs, supporting both username/password and OAuth authentication flows.

## Features

- 🔐 **Multiple Authentication Methods**: Support for username/password and OAuth 2.0 authentication
- 📊 **Complete CRUD Operations**: Create, Read, Update, Delete operations for Salesforce objects
- 🔍 **Advanced Querying**: SOQL query execution with automatic pagination support
- 📡 **Bulk Operations**: Efficient bulk data operations for large datasets
- ⚙️ **Configuration Management**: Flexible configuration from environment variables or config files
- 🎯 **Event-Driven**: Event emitters for monitoring operations and handling responses
- 📝 **Rich Metadata Support**: Object description and organization limits access
- 🔄 **Connection Management**: Automatic connection handling and reconnection
- 🛡️ **Error Handling**: Comprehensive error handling with detailed error messages

## Installation

```bash
npm install adk-salesforce-connector
```

## Quick Start

### Basic Usage with Environment Variables

1. Create a `.env` file (copy from `.env.example`):
```bash
SF_USERNAME=your-salesforce-username
SF_PASSWORD=your-salesforce-password
SF_SECURITY_TOKEN=your-security-token
SF_SANDBOX=false
```

2. Use the connector in your application:
```javascript
const { ADKSalesforceConnector, ConfigManager } = require('adk-salesforce-connector');
require('dotenv').config();

async function example() {
    // Initialize configuration
    const configManager = new ConfigManager();
    const connector = new ADKSalesforceConnector(configManager.getConnectionConfig());
    
    // Authenticate
    await connector.authenticate(configManager.getCredentials());
    
    // Query records
    const accounts = await connector.query('SELECT Id, Name FROM Account LIMIT 10');
    console.log(`Found ${accounts.totalSize} accounts`);
    
    // Create a new record
    const newAccount = await connector.create('Account', {
        Name: 'Test Account',
        Type: 'Customer'
    });
    console.log(`Created account: ${newAccount.id}`);
    
    // Disconnect
    await connector.disconnect();
}

example().catch(console.error);
```

### OAuth Authentication

```javascript
const connector = new ADKSalesforceConnector({
    loginUrl: 'https://login.salesforce.com',
    version: '59.0'
});

await connector.authenticateOAuth({
    clientId: 'your-oauth-consumer-key',
    clientSecret: 'your-oauth-consumer-secret',
    redirectUri: 'https://your-app.com/oauth/callback',
    authCode: 'authorization-code-from-oauth-flow'
});
```

## API Reference

### ADKSalesforceConnector

#### Constructor
```javascript
const connector = new ADKSalesforceConnector(config);
```

**Config Options:**
- `loginUrl` (string): Salesforce login URL (default: 'https://login.salesforce.com')
- `version` (string): API version (default: '59.0')
- `timeout` (number): Request timeout in milliseconds (default: 60000)

#### Authentication Methods

##### Username/Password Authentication
```javascript
await connector.authenticate({
    username: 'your-username',
    password: 'your-password',
    securityToken: 'your-security-token' // optional
});
```

##### OAuth 2.0 Authentication
```javascript
await connector.authenticateOAuth({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'your-redirect-uri',
    authCode: 'authorization-code'
});
```

#### CRUD Operations

##### Create Records
```javascript
const result = await connector.create('Account', {
    Name: 'New Account',
    Type: 'Customer',
    Phone: '+1-555-123-4567'
});
```

##### Retrieve Records
```javascript
const account = await connector.retrieve('Account', 'recordId', 'Id,Name,Type');
```

##### Update Records
```javascript
const result = await connector.update('Account', 'recordId', {
    Name: 'Updated Account Name',
    Phone: '+1-555-987-6543'
});
```

##### Delete Records
```javascript
const result = await connector.delete('Account', 'recordId');
```

#### Querying

##### Basic Query
```javascript
const result = await connector.query('SELECT Id, Name FROM Account WHERE Type = \'Customer\' LIMIT 100');
```

##### Query All (with automatic pagination)
```javascript
const result = await connector.queryAll('SELECT Id, Name FROM Account WHERE Type = \'Customer\'');
```

#### Metadata and Utilities

##### Describe Objects
```javascript
const description = await connector.describe('Account');
console.log(`Account has ${description.fields.length} fields`);
```

##### Get Organization Limits
```javascript
const limits = await connector.getLimits();
console.log(`API calls remaining: ${limits.DailyApiRequests.Remaining}`);
```

##### Bulk Operations
```javascript
const records = [
    { Name: 'Account 1', Type: 'Customer' },
    { Name: 'Account 2', Type: 'Prospect' }
];
const results = await connector.bulkCreate('Account', records);
```

#### Connection Management

##### Check Connection Status
```javascript
if (connector.isConnectionActive()) {
    console.log('Connected to Salesforce');
}
```

##### Get Connection Information
```javascript
const info = connector.getConnectionInfo();
console.log(`Connected to: ${info.instanceUrl}`);
```

##### Disconnect
```javascript
await connector.disconnect();
```

### ConfigManager

The ConfigManager helps load and validate configuration from various sources.

```javascript
const configManager = new ConfigManager('/path/to/config.json');

// Get credentials for authentication
const credentials = configManager.getCredentials();

// Get OAuth configuration
const oauthConfig = configManager.getOAuthConfig();

// Get connection configuration
const connectionConfig = configManager.getConnectionConfig();

// Validate configuration
configManager.validate();
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SF_USERNAME` | Salesforce username | - |
| `SF_PASSWORD` | Salesforce password | - |
| `SF_SECURITY_TOKEN` | Security token (if required) | - |
| `SF_LOGIN_URL` | Login URL | https://login.salesforce.com |
| `SF_API_VERSION` | API version | 59.0 |
| `SF_SANDBOX` | Use sandbox (true/false) | false |
| `SF_CLIENT_ID` | OAuth client ID | - |
| `SF_CLIENT_SECRET` | OAuth client secret | - |
| `SF_REDIRECT_URI` | OAuth redirect URI | - |

## Events

The connector emits various events that you can listen to:

```javascript
connector.on('connected', (userInfo) => {
    console.log('Connected to Salesforce');
});

connector.on('error', (error) => {
    console.error('Error occurred:', error);
});

connector.on('recordCreated', (event) => {
    console.log(`Created ${event.type} record: ${event.id}`);
});

connector.on('recordUpdated', (event) => {
    console.log(`Updated ${event.type} record: ${event.id}`);
});

connector.on('recordDeleted', (event) => {
    console.log(`Deleted ${event.type} record: ${event.id}`);
});

connector.on('queryExecuted', (event) => {
    console.log(`Query returned ${event.recordCount} records`);
});

connector.on('disconnected', () => {
    console.log('Disconnected from Salesforce');
});
```

## Examples

See the `examples/` directory for complete usage examples:

- `examples/example.js` - Basic usage demonstration
- Run with: `npm start`

## Testing

Run the included tests:

```bash
npm test
```

## Configuration Files

You can also use JSON configuration files:

```json
{
    "username": "your-username",
    "password": "your-password",
    "securityToken": "your-security-token",
    "loginUrl": "https://login.salesforce.com",
    "version": "59.0",
    "sandbox": false,
    "oauth": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "redirectUri": "https://your-app.com/callback"
    }
}
```

## Requirements

- Node.js 14.0.0 or higher
- Valid Salesforce account with API access
- Security token (for username/password auth) or OAuth app setup

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
