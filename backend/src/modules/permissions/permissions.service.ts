import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from '../../common/enums/role.enum';

export const PERMISSION_CODES = {
  MANAGER_VIEW: 'MANAGER_VIEW',
  MANAGER_CREATE: 'MANAGER_CREATE',
  MANAGER_UPDATE: 'MANAGER_UPDATE',
  MANAGER_LOCK: 'MANAGER_LOCK',
  MANAGER_DELETE: 'MANAGER_DELETE',
  MANAGER_CHANGE_ROLE: 'MANAGER_CHANGE_ROLE',
  MANAGER_RESET_PASSWORD: 'MANAGER_RESET_PASSWORD',

  STAFF_VIEW: 'STAFF_VIEW',
  STAFF_CREATE: 'STAFF_CREATE',
  STAFF_UPDATE: 'STAFF_UPDATE',
  STAFF_LOCK: 'STAFF_LOCK',

  CATEGORY_MANAGE: 'CATEGORY_MANAGE',
  BRAND_MANAGE: 'BRAND_MANAGE',
  PRODUCT_MANAGE: 'PRODUCT_MANAGE',
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  ORDER_VIEW: 'ORDER_VIEW',
  ORDER_MANAGE: 'ORDER_MANAGE',
  ORDER_UPDATE: 'ORDER_UPDATE',
  DISCOUNT_MANAGE: 'DISCOUNT_MANAGE',
  RETURN_MANAGE: 'RETURN_MANAGE',
  LOYALTY_MANAGE: 'LOYALTY_MANAGE',
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
  REPORT_VIEW: 'REPORT_VIEW',
};

@Injectable()
export class PermissionsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedPermissions();
  }

  async seedPermissions() {
    const permissionsToSeed = [
      { code: PERMISSION_CODES.MANAGER_VIEW, description: 'Xem danh sách/chi tiết Manager' },
      { code: PERMISSION_CODES.MANAGER_CREATE, description: 'Tạo mới Manager' },
      { code: PERMISSION_CODES.MANAGER_UPDATE, description: 'Sửa thông tin Manager' },
      { code: PERMISSION_CODES.MANAGER_LOCK, description: 'Khóa / mở khóa Manager' },
      { code: PERMISSION_CODES.MANAGER_DELETE, description: 'Xóa vĩnh viễn Manager' },
      { code: PERMISSION_CODES.MANAGER_CHANGE_ROLE, description: 'Đổi role Manager' },
      { code: PERMISSION_CODES.MANAGER_RESET_PASSWORD, description: 'Reset password Manager' },

      { code: PERMISSION_CODES.STAFF_VIEW, description: 'Xem danh sách Staff' },
      { code: PERMISSION_CODES.STAFF_CREATE, description: 'Tạo mới Staff' },
      { code: PERMISSION_CODES.STAFF_UPDATE, description: 'Sửa thông tin Staff' },
      { code: PERMISSION_CODES.STAFF_LOCK, description: 'Khóa / mở khóa Staff' },

      { code: PERMISSION_CODES.CATEGORY_MANAGE, description: 'Quản lý danh mục' },
      { code: PERMISSION_CODES.BRAND_MANAGE, description: 'Quản lý thương hiệu' },
      { code: PERMISSION_CODES.PRODUCT_MANAGE, description: 'Quản lý sản phẩm' },
      { code: PERMISSION_CODES.PRODUCT_VIEW, description: 'Xem sản phẩm' },
      { code: PERMISSION_CODES.ORDER_VIEW, description: 'Xem đơn hàng' },
      { code: PERMISSION_CODES.ORDER_MANAGE, description: 'Quản lý đơn hàng' },
      { code: PERMISSION_CODES.ORDER_UPDATE, description: 'Cập nhật trạng thái đơn hàng' },
      { code: PERMISSION_CODES.DISCOUNT_MANAGE, description: 'Quản lý mã giảm giá' },
      { code: PERMISSION_CODES.RETURN_MANAGE, description: 'Xem & xử lý yêu cầu hoàn trả' },
      { code: PERMISSION_CODES.LOYALTY_MANAGE, description: 'Quản lý điểm tích lũy khách hàng' },
      { code: PERMISSION_CODES.AUDIT_LOG_VIEW, description: 'Xem audit log hệ thống' },
      { code: PERMISSION_CODES.REPORT_VIEW, description: 'Xem báo cáo & dashboard' },
    ];

    const permCount = await this.permissionRepo.count();
    const rolePermCount = await this.rolePermissionRepo.count();
    if (permCount === permissionsToSeed.length && rolePermCount === 65) {
      return; // Đã seed đầy đủ permissions và role mappings, bỏ qua để tránh lag khởi động
    }

    const permMap = new Map<string, Permission>();

    for (const item of permissionsToSeed) {
      let perm = await this.permissionRepo.findOne({ where: { code: item.code } });
      if (!perm) {
        perm = this.permissionRepo.create(item);
        await this.permissionRepo.save(perm);
      }
      permMap.set(item.code, perm);
    }

    // Role mappings based on spec.md 1.2 & 1.3
    const roleMappings: { role: UserRole; codes: string[] }[] = [
      {
        role: UserRole.SUPER_ADMIN,
        codes: Object.values(PERMISSION_CODES),
      },
      {
        role: UserRole.CEO,
        codes: [
          PERMISSION_CODES.MANAGER_VIEW,
          PERMISSION_CODES.MANAGER_CREATE,
          PERMISSION_CODES.MANAGER_UPDATE,
          PERMISSION_CODES.MANAGER_LOCK,
          PERMISSION_CODES.MANAGER_RESET_PASSWORD,
          PERMISSION_CODES.STAFF_VIEW,
          PERMISSION_CODES.STAFF_CREATE,
          PERMISSION_CODES.STAFF_UPDATE,
          PERMISSION_CODES.STAFF_LOCK,
          PERMISSION_CODES.CATEGORY_MANAGE,
          PERMISSION_CODES.BRAND_MANAGE,
          PERMISSION_CODES.PRODUCT_MANAGE,
          PERMISSION_CODES.PRODUCT_VIEW,
          PERMISSION_CODES.ORDER_VIEW,
          PERMISSION_CODES.ORDER_MANAGE,
          PERMISSION_CODES.ORDER_UPDATE,
          PERMISSION_CODES.DISCOUNT_MANAGE,
          PERMISSION_CODES.RETURN_MANAGE,
          PERMISSION_CODES.LOYALTY_MANAGE,
          PERMISSION_CODES.AUDIT_LOG_VIEW,
          PERMISSION_CODES.REPORT_VIEW,
        ],
      },
      {
        role: UserRole.MANAGER,
        codes: [
          PERMISSION_CODES.STAFF_VIEW,
          PERMISSION_CODES.STAFF_CREATE,
          PERMISSION_CODES.STAFF_UPDATE,
          PERMISSION_CODES.STAFF_LOCK,
          PERMISSION_CODES.CATEGORY_MANAGE,
          PERMISSION_CODES.BRAND_MANAGE,
          PERMISSION_CODES.PRODUCT_MANAGE,
          PERMISSION_CODES.PRODUCT_VIEW,
          PERMISSION_CODES.ORDER_VIEW,
          PERMISSION_CODES.ORDER_MANAGE,
          PERMISSION_CODES.ORDER_UPDATE,
          PERMISSION_CODES.DISCOUNT_MANAGE,
          PERMISSION_CODES.RETURN_MANAGE,
          PERMISSION_CODES.LOYALTY_MANAGE,
          PERMISSION_CODES.REPORT_VIEW,
        ],
      },
      {
        role: UserRole.STAFF,
        codes: [
          PERMISSION_CODES.PRODUCT_VIEW,
          PERMISSION_CODES.ORDER_VIEW,
          PERMISSION_CODES.ORDER_UPDATE,
          PERMISSION_CODES.RETURN_MANAGE,
          PERMISSION_CODES.LOYALTY_MANAGE,
        ],
      },
      {
        role: UserRole.CUSTOMER,
        codes: [PERMISSION_CODES.PRODUCT_VIEW],
      },
    ];

    for (const mapping of roleMappings) {
      const allowedPermIds = mapping.codes
        .map((code) => permMap.get(code)?.id)
        .filter((id): id is string => !!id);

      const existing = await this.rolePermissionRepo.find({
        where: { role: mapping.role },
      });

      for (const rp of existing) {
        if (!allowedPermIds.includes(rp.permission_id)) {
          await this.rolePermissionRepo.remove(rp);
        }
      }

      for (const permId of allowedPermIds) {
        const hasIt = existing.some((rp) => rp.permission_id === permId);
        if (!hasIt) {
          const rolePerm = this.rolePermissionRepo.create({
            role: mapping.role,
            permission_id: permId,
          });
          await this.rolePermissionRepo.save(rolePerm);
        }
      }
    }
  }

  async getUserPermissions(role: UserRole): Promise<string[]> {
    try {
      const rolePerms = await this.rolePermissionRepo.find({
        where: { role },
        relations: ['permission'],
      });
      return rolePerms
        .filter((rp) => rp && rp.permission && rp.permission.code)
        .map((rp) => rp.permission.code);
    } catch {
      return [];
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find();
  }
}
