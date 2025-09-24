import { Client, Databases } from 'appwrite';

export interface ConnectionPoolOptions {
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  connectionErrors: number;
  poolUtilization: number;
}

export interface PooledConnection {
  id: string;
  client: Client;
  database: Databases;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  requestCount: number;
}

export class DatabaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private options: Required<ConnectionPoolOptions>;
  private metrics: ConnectionMetrics;
  private isShuttingDown = false;

  constructor(
    private endpoint: string,
    private projectId: string,
    options: ConnectionPoolOptions = {}
  ) {
    this.options = {
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      connectionTimeout: options.connectionTimeout || 30000,
      idleTimeout: options.idleTimeout || 300000, // 5 minutes
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableMetrics: options.enableMetrics ?? true
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      connectionErrors: 0,
      poolUtilization: 0
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Create minimum connections
    for (let i = 0; i < this.options.minConnections; i++) {
      try {
        await this.createConnection();
      } catch (error) {
        console.error('Failed to create initial connection:', error);
      }
    }

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  private async createConnection(): Promise<PooledConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const client = new Client()
        .setEndpoint(this.endpoint)
        .setProject(this.projectId);

      const database = new Databases(client);
      
      const connection: PooledConnection = {
        id,
        client,
        database,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: false,
        requestCount: 0
      };

      this.connections.set(id, connection);
      this.updateMetrics();
      
      return connection;
    } catch (error) {
      this.metrics.connectionErrors++;
      throw new Error(`Failed to create database connection: ${error}`);
    }
  }

  async getConnection(): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    // Try to get an idle connection
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      idleConnection.isActive = true;
      idleConnection.lastUsed = Date.now();
      this.updateMetrics();
      return idleConnection;
    }

    // Create new connection if under max limit
    if (this.connections.size < this.options.maxConnections) {
      try {
        const newConnection = await this.createConnection();
        newConnection.isActive = true;
        this.updateMetrics();
        return newConnection;
      } catch (error) {
        // Fall through to waiting queue
      }
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection timeout'));
      }, this.options.connectionTimeout);

      this.waitingQueue.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });
    });
  }

  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.isActive) {
      connection.isActive = false;
      connection.lastUsed = Date.now();
      
      // Serve waiting requests
      if (this.waitingQueue.length > 0) {
        const waiting = this.waitingQueue.shift();
        if (waiting) {
          connection.isActive = true;
          waiting.resolve(connection);
        }
      }
      
      this.updateMetrics();
    }
  }

  async executeWithConnection<T>(
    operation: (database: Databases) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let connection: PooledConnection | null = null;
    
    try {
      this.metrics.totalRequests++;
      
      connection = await this.getConnection();
      connection.requestCount++;
      
      const result = await operation(connection.database);
      
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    } finally {
      if (connection) {
        this.releaseConnection(connection.id);
      }
    }
  }

  async executeWithRetry<T>(
    operation: (database: Databases) => Promise<T>,
    maxAttempts?: number
  ): Promise<T> {
    const attempts = maxAttempts || this.options.retryAttempts;
    let lastError: Error;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.executeWithConnection(operation);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === attempts) {
          throw lastError;
        }

        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.options.retryDelay * attempt)
        );
      }
    }

    throw lastError!;
  }

  private getIdleConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        return connection;
      }
    }
    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    // Remove idle connections that exceed idle timeout
    for (const [id, connection] of this.connections.entries()) {
      if (
        !connection.isActive &&
        now - connection.lastUsed > this.options.idleTimeout &&
        this.connections.size > this.options.minConnections
      ) {
        connectionsToRemove.push(id);
      }
    }

    connectionsToRemove.forEach(id => {
      this.connections.delete(id);
    });

    // Clean up expired waiting requests
    const validWaiting = this.waitingQueue.filter(item => {
      if (now - item.timestamp > this.options.connectionTimeout) {
        item.reject(new Error('Connection request expired'));
        return false;
      }
      return true;
    });
    
    this.waitingQueue = validWaiting;
    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (!this.options.enableMetrics) return;

    this.metrics.totalConnections = this.connections.size;
    this.metrics.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive).length;
    this.metrics.idleConnections = this.metrics.totalConnections - this.metrics.activeConnections;
    this.metrics.poolUtilization = this.metrics.totalConnections > 0 
      ? this.metrics.activeConnections / this.metrics.totalConnections 
      : 0;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.successfulRequests;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getConnectionDetails(): Array<{
    id: string;
    isActive: boolean;
    createdAt: number;
    lastUsed: number;
    requestCount: number;
    age: number;
  }> {
    const now = Date.now();
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      requestCount: conn.requestCount,
      age: now - conn.createdAt
    }));
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Reject all waiting requests
    this.waitingQueue.forEach(waiting => {
      waiting.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingQueue = [];

    // Wait for active connections to finish (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.metrics.activeConnections > 0 && Date.now() - startTime < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.updateMetrics();
    }

    // Force close all connections
    this.connections.clear();
    this.updateMetrics();
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      totalConnections: number;
      activeConnections: number;
      waitingRequests: number;
      errorRate: number;
      averageResponseTime: number;
    };
  }> {
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 0.1 || this.metrics.averageResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 0.05 || this.metrics.averageResponseTime > 2000 || this.waitingQueue.length > 5) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalConnections: this.metrics.totalConnections,
        activeConnections: this.metrics.activeConnections,
        waitingRequests: this.waitingQueue.length,
        errorRate,
        averageResponseTime: this.metrics.averageResponseTime
      }
    };
  }
}

// Global connection pool instance
let globalConnectionPool: DatabaseConnectionPool | null = null;

export function initializeConnectionPool(endpoint: string, projectId: string, options?: ConnectionPoolOptions): DatabaseConnectionPool {
  if (globalConnectionPool) {
    throw new Error('Connection pool already initialized');
  }
  
  globalConnectionPool = new DatabaseConnectionPool(endpoint, projectId, options);
  return globalConnectionPool;
}

export function getConnectionPool(): DatabaseConnectionPool {
  if (!globalConnectionPool) {
    throw new Error('Connection pool not initialized. Call initializeConnectionPool first.');
  }
  
  return globalConnectionPool;
}

export async function shutdownConnectionPool(): Promise<void> {
  if (globalConnectionPool) {
    await globalConnectionPool.shutdown();
    globalConnectionPool = null;
  }
}