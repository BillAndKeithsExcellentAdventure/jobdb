"use strict";
// Console logging strategy
class ConsoleLogStrategy {
    log(message) {
        console.log(`[Console] ${new Date().toISOString()} - ${message}`);
    }
}
// File logging strategy (simulated)
class FileLogStrategy {
    fileName;
    constructor(fileName = "log.txt") {
        this.fileName = fileName;
    }
    log(message) {
        // Simulate writing to a file (in a real scenario, you'd use a library like `fs` for Node.js)
        console.log(`[File: ${this.fileName}] ${new Date().toISOString()} - ${message}`);
    }
}
// Azure logging strategy (simulated)
class AzureLogStrategy {
    azureEndpoint;
    constructor(endpoint) {
        this.azureEndpoint = endpoint;
    }
    log(message) {
        // Simulate sending a log message to Azure (in a real scenario, use Azure SDKs or HTTP requests)
        console.log(`[Azure: ${this.azureEndpoint}] ${new Date().toISOString()} - ${message}`);
    }
}
// Logger class
class DBLogger {
    strategy;
    constructor(strategy) {
        this.strategy = strategy;
    }
    // Method to change the logging strategy at runtime
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    // Log a message using the configured strategy
    log(message) {
        this.strategy.log(message);
    }
}
// Example usage
//   const logger = new Logger(new ConsoleLogStrategy());
//   logger.log("This is a console log."); // Logs to console
//   logger.setStrategy(new FileLogStrategy("app.log"));
//   logger.log("This is a file log."); // Simulates writing to a file
//   logger.setStrategy(new AzureLogStrategy("https://my-azure-endpoint.com"));
//   logger.log("This is an Azure log."); // Simulates sending to Azure
