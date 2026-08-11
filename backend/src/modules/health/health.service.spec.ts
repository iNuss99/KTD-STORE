import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { DataSource } from 'typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let dataSourceMock: Partial<DataSource>;

  beforeEach(async () => {
    dataSourceMock = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should return healthy status when database is reachable', async () => {
    const result = await service.check();

    expect(result.statusCode).toBe(200);
    expect(result.data.status).toBe('healthy');
    expect(result.data.checks.database.status).toBe('up');
    expect(result.data.checks.database.latencyMs).toBeDefined();
    expect(result.data.checks.memory.heapUsedMB).toBeGreaterThan(0);
  });

  it('should return unhealthy status when database query fails', async () => {
    (dataSourceMock.query as jest.Mock).mockRejectedValue(new Error('Connection lost'));

    const result = await service.check();

    expect(result.statusCode).toBe(503);
    expect(result.data.status).toBe('unhealthy');
    expect(result.data.checks.database.status).toBe('down');
    expect(result.data.checks.database.error).toBe('Connection lost');
  });
});
