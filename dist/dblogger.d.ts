interface LogStrategy {
    log(message: string): void;
}
declare class ConsoleLogStrategy implements LogStrategy {
    log(message: string): void;
}
declare class FileLogStrategy implements LogStrategy {
    private fileName;
    constructor(fileName?: string);
    log(message: string): void;
}
declare class AzureLogStrategy implements LogStrategy {
    private azureEndpoint;
    constructor(endpoint: string);
    log(message: string): void;
}
declare class DBLogger {
    private strategy;
    constructor(strategy: LogStrategy);
    setStrategy(strategy: LogStrategy): void;
    log(message: string): void;
}
