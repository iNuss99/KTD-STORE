import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSION_CODES } from '../permissions/permissions.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('seed')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async seedMockData() {
    return { message: 'Chức năng tạo dữ liệu ảo đã bị vô hiệu hóa để bảo vệ cơ sở dữ liệu Neon.', seeded: false };
  }

  @Post('seed-single')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async seedSingleOrder() {
    return { message: 'Chức năng tạo dữ liệu ảo đã bị vô hiệu hóa để bảo vệ cơ sở dữ liệu Neon.', seeded: false };
  }

  @Get('overview')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('revenue')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async getRevenueReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getRevenueReport(query);
  }

  @Get('top-products')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async getTopProducts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.reportsService.getTopProducts(limitNum);
  }

  @Get('low-stock')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async getLowStockVariants(@Query('threshold') threshold?: string) {
    const thresholdNum = threshold ? parseInt(threshold, 10) : 5;
    return this.reportsService.getLowStockVariants(thresholdNum);
  }

  @Get('staff-performance')
  @Permissions(PERMISSION_CODES.REPORT_VIEW)
  async getStaffPerformance() {
    return this.reportsService.getStaffPerformance();
  }
}
