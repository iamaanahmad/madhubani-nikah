#!/usr/bin/env node

/**
 * Health Check Script
 * Monitors application health and system status
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class HealthChecker {
  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    this.appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    this.checks = [];
  }

  async runHealthCheck() {
    console.log('🏥 Running health check...\n');

    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      responseTime: 0,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      // Application health checks
      results.checks.application = await this.checkApplication();
      results.checks.database = await this.checkDatabase();
      results.checks.storage = await this.checkStorage();
      results.checks.memory = await this.checkMemory();
      results.checks.disk = await this.checkDisk();
      results.checks.network = await this.checkNetwork();
      results.checks.dependencies = await this.checkDependencies();

      // Calculate overall status
      const failedChecks = Object.values(results.checks).filter(check => !check.healthy);
      if (failedChecks.length === 0) {
        results.status = 'healthy';
      } else if (failedChecks.length <= 2) {
        results.status = 'degraded';
      } else {
        results.status = 'unhealthy';
      }

      results.responseTime = Date.now() - startTime;

      // Display results
      this.displayResults(results);

      // Save results to file
      this.saveResults(results);

      return results;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      results.status = 'unhealthy';
      results.error = error.message;
      return results;
    }
  }

  async checkApplication() {
    console.log('🔍 Checking application...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      
      return {
        healthy: response.statusCode === 200,
        responseTime: response.responseTime,
        status: response.statusCode,
        message: response.statusCode === 200 ? 'Application is responding' : 'Application not responding',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Application health check failed',
      };
    }
  }

  async checkDatabase() {
    console.log('🔍 Checking database connection...');
    
    try {
      if (!this.appwriteEndpoint) {
        return {
          healthy: false,
          message: 'Appwrite endpoint not configured',
        };
      }

      const response = await this.makeRequest(`${this.appwriteEndpoint}/health`);
      
      return {
        healthy: response.statusCode === 200,
        responseTime: response.responseTime,
        message: response.statusCode === 200 ? 'Database is accessible' : 'Database connection failed',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Database health check failed',
      };
    }
  }

  async checkStorage() {
    console.log('🔍 Checking storage...');
    
    try {
      if (!this.appwriteEndpoint) {
        return {
          healthy: false,
          message: 'Storage endpoint not configured',
        };
      }

      // Check if storage service is accessible
      const response = await this.makeRequest(`${this.appwriteEndpoint}/storage`);
      
      return {
        healthy: response.statusCode === 200 || response.statusCode === 401, // 401 is expected without auth
        responseTime: response.responseTime,
        message: 'Storage service is accessible',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Storage health check failed',
      };
    }
  }

  async checkMemory() {
    console.log('🔍 Checking memory usage...');
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    const healthy = memoryUsagePercent < 80; // Alert if memory usage > 80%
    
    return {
      healthy,
      memoryUsage: {
        total: this.formatBytes(totalMemory),
        used: this.formatBytes(usedMemory),
        percentage: Math.round(memoryUsagePercent),
      },
      message: healthy ? 'Memory usage is normal' : 'High memory usage detected',
    };
  }

  async checkDisk() {
    console.log('🔍 Checking disk space...');
    
    try {
      const stats = fs.statSync(process.cwd());
      
      // This is a simplified check - in production, use a proper disk space library
      return {
        healthy: true,
        message: 'Disk space check completed',
        note: 'Detailed disk space monitoring requires additional tooling',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Disk space check failed',
      };
    }
  }

  async checkNetwork() {
    console.log('🔍 Checking network connectivity...');
    
    try {
      // Test external connectivity
      const response = await this.makeRequest('https://www.google.com', { timeout: 5000 });
      
      return {
        healthy: response.statusCode === 200,
        responseTime: response.responseTime,
        message: response.statusCode === 200 ? 'Network connectivity is good' : 'Network connectivity issues',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Network connectivity check failed',
      };
    }
  }

  async checkDependencies() {
    console.log('🔍 Checking critical dependencies...');
    
    const criticalDependencies = [
      'next',
      'react',
      'appwrite',
    ];

    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const missingDependencies = criticalDependencies.filter(dep => !dependencies[dep]);
      
      return {
        healthy: missingDependencies.length === 0,
        installedDependencies: criticalDependencies.filter(dep => dependencies[dep]),
        missingDependencies,
        message: missingDependencies.length === 0 
          ? 'All critical dependencies are installed' 
          : `Missing dependencies: ${missingDependencies.join(', ')}`,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Dependencies check failed',
      };
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.startsWith('https:') ? https : http;
      const timeout = options.timeout || 10000;
      
      const req = client.get(url, { timeout }, (res) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  displayResults(results) {
    console.log('\n📊 Health Check Results:');
    console.log(`   Status: ${this.getStatusEmoji(results.status)} ${results.status.toUpperCase()}`);
    console.log(`   Response Time: ${results.responseTime}ms`);
    console.log(`   Uptime: ${Math.floor(results.uptime / 60)} minutes`);
    console.log(`   Version: ${results.version}`);
    console.log(`   Environment: ${results.environment}`);
    console.log(`   Timestamp: ${results.timestamp}\n`);

    console.log('🔍 Individual Checks:');
    for (const [checkName, checkResult] of Object.entries(results.checks)) {
      const status = checkResult.healthy ? '✅' : '❌';
      const responseTime = checkResult.responseTime ? ` (${checkResult.responseTime}ms)` : '';
      console.log(`   ${status} ${checkName}${responseTime}: ${checkResult.message}`);
      
      if (checkResult.error) {
        console.log(`      Error: ${checkResult.error}`);
      }
    }

    console.log('\n');
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  }

  saveResults(results) {
    const resultsDir = path.resolve(process.cwd(), 'health-checks');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `health-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`📄 Health check results saved to: ${filepath}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create health endpoint handler
function createHealthEndpoint() {
  const healthEndpointPath = path.resolve(process.cwd(), 'src/app/api/health/route.ts');
  const healthEndpointDir = path.dirname(healthEndpointPath);

  if (!fs.existsSync(healthEndpointDir)) {
    fs.mkdirSync(healthEndpointDir, { recursive: true });
  }

  const healthEndpointContent = `import { NextResponse } from 'next/server';
import { ProductionMonitor } from '@/lib/monitoring/production-monitor';

export async function GET() {
  try {
    const monitor = ProductionMonitor.getInstance();
    const healthCheck = monitor.getHealthCheck();
    
    const status = healthCheck.status === 'healthy' ? 200 : 
                   healthCheck.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}`;

  if (!fs.existsSync(healthEndpointPath)) {
    fs.writeFileSync(healthEndpointPath, healthEndpointContent);
    console.log('✅ Health endpoint created at /api/health');
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  
  // Create health endpoint if it doesn't exist
  createHealthEndpoint();
  
  // Run health check
  checker.runHealthCheck()
    .then(results => {
      process.exit(results.status === 'healthy' ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

module.exports = HealthChecker;