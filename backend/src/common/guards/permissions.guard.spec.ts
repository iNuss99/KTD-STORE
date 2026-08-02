import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { UserRole } from '../enums/role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionsService: jest.Mocked<PermissionsService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    permissionsService = {
      getUserPermissions: jest.fn(),
    } as any;

    guard = new PermissionsGuard(reflector, permissionsService);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('cho phép truy cập nếu route không yêu cầu permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext({ role: UserRole.STAFF });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('từ chối (throw ForbiddenException) nếu user không tồn tại', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGER_VIEW']);
    const context = createMockContext(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('cho phép truy cập khi role có chứa permission code yêu cầu', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGER_VIEW']);
    permissionsService.getUserPermissions.mockResolvedValue(['MANAGER_VIEW', 'MANAGER_CREATE']);
    const context = createMockContext({ role: UserRole.CEO });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('từ chối (throw ForbiddenException) khi role KHÔNG có permission code yêu cầu', async () => {
    reflector.getAllAndOverride.mockReturnValue(['MANAGER_DELETE']);
    permissionsService.getUserPermissions.mockResolvedValue(['MANAGER_VIEW', 'MANAGER_CREATE']);
    const context = createMockContext({ role: UserRole.CEO });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
