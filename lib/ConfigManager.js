const fs = require('fs');
const path = require('path');

/**
 * Configuration Manager for ADK Salesforce Connector
 * Handles loading and validating configuration from various sources
 */
class ConfigManager {
    constructor(configPath = null) {
        this.configPath = configPath;
        this.config = {};
        this.loadConfig();
    }

    /**
     * Load configuration from file or environment variables
     */
    loadConfig() {
        // Load from environment variables first
        this.loadFromEnvironment();
        
        // Override with config file if provided
        if (this.configPath) {
            this.loadFromFile(this.configPath);
        }
    }

    /**
     * Load configuration from environment variables
     */
    loadFromEnvironment() {
        this.config = {
            username: process.env.SF_USERNAME,
            password: process.env.SF_PASSWORD,
            securityToken: process.env.SF_SECURITY_TOKEN,
            loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
            version: process.env.SF_API_VERSION || '59.0',
            clientId: process.env.SF_CLIENT_ID,
            clientSecret: process.env.SF_CLIENT_SECRET,
            redirectUri: process.env.SF_REDIRECT_URI,
            sandbox: process.env.SF_SANDBOX === 'true'
        };

        // Adjust login URL for sandbox
        if (this.config.sandbox) {
            this.config.loginUrl = 'https://test.salesforce.com';
        }
    }

    /**
     * Load configuration from a JSON file
     */
    loadFromFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const fileConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.config = { ...this.config, ...fileConfig };
            }
        } catch (error) {
            throw new Error(`Failed to load config from file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Get the current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get authentication credentials for username/password flow
     */
    getCredentials() {
        const { username, password, securityToken } = this.config;
        
        if (!username || !password) {
            throw new Error('Username and password must be configured');
        }
        
        return { username, password, securityToken };
    }

    /**
     * Get OAuth configuration
     */
    getOAuthConfig() {
        const { clientId, clientSecret, redirectUri } = this.config;
        
        if (!clientId || !clientSecret) {
            throw new Error('OAuth client ID and secret must be configured');
        }
        
        return { clientId, clientSecret, redirectUri };
    }

    /**
     * Get connection configuration
     */
    getConnectionConfig() {
        const { loginUrl, version, timeout } = this.config;
        return { loginUrl, version, timeout };
    }

    /**
     * Validate the configuration
     */
    validate() {
        const errors = [];
        
        // Check if we have either username/password or OAuth credentials
        const hasBasicAuth = this.config.username && this.config.password;
        const hasOAuth = this.config.clientId && this.config.clientSecret;
        
        if (!hasBasicAuth && !hasOAuth) {
            errors.push('Either username/password or OAuth credentials (clientId/clientSecret) must be configured');
        }
        
        // Validate login URL format
        if (this.config.loginUrl && !this.config.loginUrl.startsWith('https://')) {
            errors.push('Login URL must start with https://');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        return true;
    }

    /**
     * Create a sample configuration file
     */
    static createSampleConfig(filePath) {
        const sampleConfig = {
            username: "your-salesforce-username",
            password: "your-salesforce-password", 
            securityToken: "your-security-token",
            loginUrl: "https://login.salesforce.com",
            version: "59.0",
            sandbox: false,
            oauth: {
                clientId: "your-oauth-client-id",
                clientSecret: "your-oauth-client-secret",
                redirectUri: "https://your-app.com/oauth/callback"
            }
        };
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(sampleConfig, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Failed to create sample config: ${error.message}`);
        }
    }
}

module.exports = ConfigManager;