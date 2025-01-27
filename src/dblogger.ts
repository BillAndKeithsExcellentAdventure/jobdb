// Define the interface for different logging strategies
interface LogStrategy {
    log(message: string): void;
}

// Console logging strategy
class ConsoleLogStrategy implements LogStrategy {
    log(message: string): void {
        console.log(`[Console] ${new Date().toISOString()} - ${message}`);
    }
}

// File logging strategy (simulated)
class FileLogStrategy implements LogStrategy {
    private fileName: string;

    constructor(fileName: string = "log.txt") {
        this.fileName = fileName;
    }

    log(message: string): void {
        // Simulate writing to a file (in a real scenario, you'd use a library like `fs` for Node.js)
        console.log(`[File: ${this.fileName}] ${new Date().toISOString()} - ${message}`);
    }
}

// Azure logging strategy (simulated)
class AzureLogStrategy implements LogStrategy {
    private azureEndpoint: string;

    constructor(endpoint: string) {
        this.azureEndpoint = endpoint;
    }

    log(message: string): void {
        // Simulate sending a log message to Azure (in a real scenario, use Azure SDKs or HTTP requests)
        console.log(`[Azure: ${this.azureEndpoint}] ${new Date().toISOString()} - ${message}`);
    }
}

// Logger class
class DBLogger {
    private strategy: LogStrategy;

    constructor(strategy: LogStrategy) {
        this.strategy = strategy;
    }

    // Method to change the logging strategy at runtime
    setStrategy(strategy: LogStrategy): void {
        this.strategy = strategy;
    }

    // Log a message using the configured strategy
    log(message: string): void {
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
