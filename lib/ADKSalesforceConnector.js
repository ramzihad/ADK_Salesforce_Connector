const jsforce = require('jsforce');
const EventEmitter = require('events');

/**
 * ADK Salesforce Connector
 * A comprehensive connector for Salesforce API integration
 */
class ADKSalesforceConnector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            loginUrl: config.loginUrl || 'https://login.salesforce.com',
            version: config.version || '59.0',
            timeout: config.timeout || 60000,
            ...config
        };
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Authenticate with Salesforce using username/password/security token
     */
    async authenticate(credentials) {
        try {
            const { username, password, securityToken } = credentials;
            
            if (!username || !password) {
                throw new Error('Username and password are required for authentication');
            }

            this.connection = new jsforce.Connection({
                loginUrl: this.config.loginUrl,
                version: this.config.version
            });

            const passwordWithToken = securityToken ? password + securityToken : password;
            const userInfo = await this.connection.login(username, passwordWithToken);
            
            this.isConnected = true;
            this.emit('connected', userInfo);
            
            return {
                success: true,
                userId: userInfo.id,
                organizationId: userInfo.organizationId
            };
        } catch (error) {
            this.isConnected = false;
            this.emit('error', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Authenticate with Salesforce using OAuth 2.0
     */
    async authenticateOAuth(oauthConfig) {
        try {
            const { clientId, clientSecret, redirectUri, authCode } = oauthConfig;
            
            if (!clientId || !clientSecret || !authCode) {
                throw new Error('OAuth configuration incomplete: clientId, clientSecret, and authCode are required');
            }

            this.connection = new jsforce.Connection({
                oauth2: {
                    loginUrl: this.config.loginUrl,
                    clientId: clientId,
                    clientSecret: clientSecret,
                    redirectUri: redirectUri
                },
                version: this.config.version
            });

            const userInfo = await this.connection.authorize(authCode);
            
            this.isConnected = true;
            this.emit('connected', userInfo);
            
            return {
                success: true,
                accessToken: this.connection.accessToken,
                refreshToken: this.connection.refreshToken,
                userId: userInfo.id,
                organizationId: userInfo.organizationId
            };
        } catch (error) {
            this.isConnected = false;
            this.emit('error', error);
            throw new Error(`OAuth authentication failed: ${error.message}`);
        }
    }

    /**
     * Check if the connector is connected to Salesforce
     */
    isConnectionActive() {
        return this.isConnected && this.connection && this.connection.accessToken;
    }

    /**
     * Get Salesforce connection information
     */
    getConnectionInfo() {
        if (!this.isConnectionActive()) {
            return null;
        }

        return {
            instanceUrl: this.connection.instanceUrl,
            accessToken: this.connection.accessToken ? 'HIDDEN' : null,
            version: this.connection.version,
            userId: this.connection.userInfo?.id,
            organizationId: this.connection.userInfo?.organizationId
        };
    }

    /**
     * Create a new record in Salesforce
     */
    async create(sobjectType, recordData) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.sobject(sobjectType).create(recordData);
            this.emit('recordCreated', { type: sobjectType, id: result.id, data: recordData });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Create operation failed: ${error.message}`);
        }
    }

    /**
     * Retrieve a record from Salesforce by ID
     */
    async retrieve(sobjectType, recordId, fields) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.sobject(sobjectType).retrieve(recordId, fields);
            this.emit('recordRetrieved', { type: sobjectType, id: recordId, result });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Retrieve operation failed: ${error.message}`);
        }
    }

    /**
     * Update a record in Salesforce
     */
    async update(sobjectType, recordId, updateData) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.sobject(sobjectType).update({
                Id: recordId,
                ...updateData
            });
            this.emit('recordUpdated', { type: sobjectType, id: recordId, data: updateData });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Update operation failed: ${error.message}`);
        }
    }

    /**
     * Delete a record from Salesforce
     */
    async delete(sobjectType, recordId) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.sobject(sobjectType).delete(recordId);
            this.emit('recordDeleted', { type: sobjectType, id: recordId });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Delete operation failed: ${error.message}`);
        }
    }

    /**
     * Execute a SOQL query
     */
    async query(soql) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.query(soql);
            this.emit('queryExecuted', { soql, recordCount: result.totalSize });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    /**
     * Execute a SOQL query with all results (handles pagination automatically)
     */
    async queryAll(soql) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.query(soql);
            let allRecords = [...result.records];
            
            while (!result.done) {
                const nextResult = await this.connection.queryMore(result.nextRecordsUrl);
                allRecords = [...allRecords, ...nextResult.records];
                result.records = allRecords;
                result.done = nextResult.done;
                result.nextRecordsUrl = nextResult.nextRecordsUrl;
            }
            
            this.emit('queryExecuted', { soql, recordCount: allRecords.length });
            return { ...result, records: allRecords, totalSize: allRecords.length };
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    /**
     * Describe an SObject (get metadata)
     */
    async describe(sobjectType) {
        this._ensureConnected();
        
        try {
            const result = await this.connection.sobject(sobjectType).describe();
            this.emit('objectDescribed', { type: sobjectType });
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Describe operation failed: ${error.message}`);
        }
    }

    /**
     * Get organization limits
     */
    async getLimits() {
        this._ensureConnected();
        
        try {
            const result = await this.connection.request('/services/data/v' + this.config.version + '/limits');
            return result;
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Get limits failed: ${error.message}`);
        }
    }

    /**
     * Bulk operations support
     */
    async bulkCreate(sobjectType, records) {
        this._ensureConnected();
        
        try {
            const job = this.connection.bulk.createJob(sobjectType, 'insert');
            const batch = job.createBatch();
            batch.execute(records);
            
            return new Promise((resolve, reject) => {
                batch.on('response', (rets) => {
                    this.emit('bulkOperationCompleted', { operation: 'create', type: sobjectType, count: rets.length });
                    resolve(rets);
                });
                
                batch.on('error', (error) => {
                    this.emit('error', error);
                    reject(error);
                });
            });
        } catch (error) {
            this.emit('error', error);
            throw new Error(`Bulk create operation failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from Salesforce
     */
    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.logout();
            } catch (error) {
                // Ignore logout errors
            }
        }
        
        this.isConnected = false;
        this.connection = null;
        this.emit('disconnected');
    }

    /**
     * Private method to ensure connection is active
     */
    _ensureConnected() {
        if (!this.isConnectionActive()) {
            throw new Error('Not connected to Salesforce. Please authenticate first.');
        }
    }
}

module.exports = ADKSalesforceConnector;