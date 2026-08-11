import { Injectable, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<{ statusCode: number; data: HealthCheckResult }> {
    const mem = process.memoryUsage();
    let dbStatus: 'up' | 'down' = 'down';
    let dbLatencyMs: number | undefined;
    let dbError: string | undefined;

    const start = Date.now();
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbLatencyMs = Date.now() - start;
        dbStatus = 'up';
      } else {
        dbError = 'Database DataSource is not initialized';
      }
    } catch (err: any) {
      dbError = err?.message || 'Database ping failed';
    }

    const isHealthy = dbStatus === 'up';
    const result: HealthCheckResult = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          ...(dbLatencyMs !== undefined ? { latencyMs: dbLatencyMs } : {}),
          ...(dbError ? { error: dbError } : {}),
        },
        memory: {
          heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        },
      },
    };

    return {
      statusCode: isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
      data: result,
    };
  }
}
