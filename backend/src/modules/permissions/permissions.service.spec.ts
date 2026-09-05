import { PermissionsService, PERMISSION_CODES } from './permissions.service';
import { UserRole } from '../../common/enums/role.enum';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockPermissionRepo: any;
  let mockRolePermissionRepo: any;

  beforeEach(() => {
    mockPermissionRepo = {
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: `perm-${dto.code}`, ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      find: jest.fn(),
    };

    mockRolePermissionRepo = {
      count: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: `rp-${dto.role}-${dto.permission_id}`, ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn((entity) => Promise.resolve(entity)),
    };

    service = new PermissionsService(mockPermissionRepo, mockRolePermissionRepo);
  });

  it('PERMISSION_CODES nên có RETURN_MANAGE và LOYALTY_MANAGE', () => {
    expect(PERMISSION_CODES.RETURN_MANAGE).toBe('RETURN_MANAGE');
    expect(PERMISSION_CODES.LOYALTY_MANAGE).toBe('LOYALTY_MANAGE');
  });

  it('getUserPermissions trả về danh sách permission code tương ứng với role', async () => {
    mockRolePermissionRepo.find.mockResolvedValue([
      { role: UserRole.STAFF, permission: { code: PERMISSION_CODES.RETURN_MANAGE } },
      { role: UserRole.STAFF, permission: { code: PERMISSION_CODES.ORDER_VIEW } },
    ]);

    const perms = await service.getUserPermissions(UserRole.STAFF);
    expect(perms).toEqual([PERMISSION_CODES.RETURN_MANAGE, PERMISSION_CODES.ORDER_VIEW]);
  });

  it('seedPermissions đồng bộ quyền đúng theo ma trận cấp bậc', async () => {
    mockPermissionRepo.count.mockResolvedValue(0);
    mockRolePermissionRepo.count.mockResolvedValue(0);
    mockPermissionRepo.findOne.mockImplementation(({ where }: any) => {
      return Promise.resolve({ id: `perm-${where.code}`, code: where.code });
    });
    mockRolePermissionRepo.find.mockResolvedValue([]);

    await service.seedPermissions();

    // SUPER_ADMIN có 23 permissions
    const saSaves = mockRolePermissionRepo.save.mock.calls.filter(
      (call: any[]) => call[0].role === UserRole.SUPER_ADMIN,
    );
    expect(saSaves.length).toBe(23);

    // CEO có 21 permissions (gồm tất cả quyền của MANAGER + quản lý manager/audit log, trừ MANAGER_DELETE & MANAGER_CHANGE_ROLE)
    const ceoSaves = mockRolePermissionRepo.save.mock.calls.filter(
      (call: any[]) => call[0].role === UserRole.CEO,
    );
    expect(ceoSaves.length).toBe(21);

    // MANAGER có 15 permissions
    const managerSaves = mockRolePermissionRepo.save.mock.calls.filter(
      (call: any[]) => call[0].role === UserRole.MANAGER,
    );
    expect(managerSaves.length).toBe(15);

    // STAFF có 5 permissions (PRODUCT_VIEW, ORDER_VIEW, ORDER_UPDATE, RETURN_MANAGE, LOYALTY_MANAGE)
    const staffSaves = mockRolePermissionRepo.save.mock.calls.filter(
      (call: any[]) => call[0].role === UserRole.STAFF,
    );
    expect(staffSaves.length).toBe(5);

    // CUSTOMER chỉ có 1 permission (PRODUCT_VIEW)
    const customerSaves = mockRolePermissionRepo.save.mock.calls.filter(
      (call: any[]) => call[0].role === UserRole.CUSTOMER,
    );
    expect(customerSaves.length).toBe(1);
  });
});
