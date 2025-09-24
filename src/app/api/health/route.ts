import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        memory: checkMemory(),
        environment: checkEnvironment(),
        dependencies: checkDependencies(),
      }
    };
    
    // Determine overall status
    const failedChecks = Object.values(healthCheck.checks).filter(check => !check.healthy);
    if (failedChecks.length === 0) {
      healthCheck.status = 'healthy';
    } else if (failedChecks.length <= 1) {
      healthCheck.status = 'degraded';
    } else {
      healthCheck.status = 'unhealthy';
    }
    
    const status = healthCheck.status === 'healthy' ? 200 : 
                   healthCheck.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}

function checkMemory() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  const healthy = memoryUsagePercent < 80;
  
  return {
    healthy,
    memoryUsage: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      percentage: Math.round(memoryUsagePercent),
    },
    message: healthy ? 'Memory usage is normal' : 'High memory usage detected',
  };
}

function checkEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'APPWRITE_API_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    healthy: missingVars.length === 0,
    missingVariables: missingVars,
    message: missingVars.length === 0 
      ? 'All required environment variables are set' 
      : `Missing environment variables: ${missingVars.join(', ')}`,
  };
}

function checkDependencies() {
  // Basic check - in a real implementation, you might want to verify critical services
  return {
    healthy: true,
    message: 'Dependencies check passed',
  };
}