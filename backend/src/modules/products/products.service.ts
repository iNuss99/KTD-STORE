import { Injectable, OnApplicationBootstrap, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Size } from './entities/size.entity';
import { Color } from './entities/color.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Size)
    private sizeRepo: Repository<Size>,
    @InjectRepository(Color)
    private colorRepo: Repository<Color>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private auditLogsService: AuditLogsService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedSizesAndColors();
    await this.seedMockProducts();
  }

  async seedMockProducts() {
    await this.seedSizesAndColors();
    const existingCount = await this.productRepo.count();
    if (existingCount >= 10) return;

    // 1. Ensure Brands
    const brandData = [
      { name: 'Nike', code: 'NK', slug: 'nike' },
      { name: 'Adidas', code: 'AD', slug: 'adidas' },
      { name: 'Zara', code: 'ZR', slug: 'zara' },
      { name: 'MenWear', code: 'MW', slug: 'menwear' },
    ];
    const brandMap: Record<string, Brand> = {};
    for (const b of brandData) {
      let brand = await this.brandRepo.findOne({ where: { code: b.code } });
      if (!brand) {
        brand = await this.brandRepo.save(this.brandRepo.create(b));
      }
      brandMap[b.code] = brand;
    }

    // 2. Ensure Categories
    const categoryData = [
      { name: 'Áo Sơ Mi', slug: 'ao-so-mi' },
      { name: 'Áo Polo', slug: 'ao-polo' },
      { name: 'Áo Thun', slug: 'ao-thun' },
      { name: 'Quần Kaki', slug: 'quan-kaki' },
      { name: 'Quần Tây', slug: 'quan-tay' },
      { name: 'Quần Jeans', slug: 'quan-jeans' },
      { name: 'Áo Khoác', slug: 'ao-khoac' },
      { name: 'Áo Blazer', slug: 'ao-blazer' },
    ];
    const catMap: Record<string, Category> = {};
    for (const cItem of categoryData) {
      let cat = await this.categoryRepo.findOne({ where: { name: cItem.name } });
      if (!cat) {
        cat = await this.categoryRepo.save(this.categoryRepo.create(cItem));
      }
      catMap[cItem.name] = cat;
    }

    const sizes = await this.sizeRepo.find();
    const colors = await this.colorRepo.find();
    if (!sizes || sizes.length === 0 || !colors || colors.length === 0) return;

    // 3. Mock Products Data
    const mockProducts = [
      {
        name: 'Áo Sơ Mi Nam Oxford Premium',
        code: 'SOMIXFORD',
        slug: 'ao-so-mi-nam-oxford-premium',
        description: 'Áo sơ mi Oxford chất liệu cotton cao cấp, thấm hút mồ hôi tốt, tôn dáng nam tính thanh lịch.',
        base_price: 350000,
        brand_code: 'MW',
        cat_name: 'Áo Sơ Mi',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
      },
      {
        name: 'Áo Sơ Mi Nam Dài Tay Họa Tiết Caro',
        code: 'SOMICARO',
        slug: 'ao-so-mi-nam-dai-tay-hoa-tiet-caro',
        description: 'Áo sơ mi caro thời trang, trẻ trung, thích hợp đi làm công sở và dạo phố.',
        base_price: 390000,
        brand_code: 'AD',
        cat_name: 'Áo Sơ Mi',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
      },
      {
        name: 'Áo Polo Nam Co Giãn Thể Thao',
        code: 'POLOSPORT',
        slug: 'ao-polo-nam-co-gian-the-thao',
        description: 'Áo Polo thể thao nam thoáng khí, kiểu dáng ôm nhẹ hiện đại, chống nhăn hiệu quả.',
        base_price: 280000,
        brand_code: 'NK',
        cat_name: 'Áo Polo',
        image: 'https://images.unsplash.com/photo-1625910513413-7e155452d3a9?w=800&q=80',
      },
      {
        name: 'Áo Polo Nam Pique Cotton Basic',
        code: 'POLOBASIC',
        slug: 'ao-polo-nam-pique-cotton-basic',
        description: 'Áo Polo Pique Cotton cổ cổ điển, đường may tinh tế dệt nguyên sợi.',
        base_price: 299000,
        brand_code: 'MW',
        cat_name: 'Áo Polo',
        image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80',
      },
      {
        name: 'Áo Thun Nam Cotton Form Wide-fit',
        code: 'THUNWIDE',
        slug: 'ao-thun-nam-cotton-form-wide-fit',
        description: 'Áo thun nam chất liệu 100% cotton thoáng mát, phom rộng trẻ trung cá tính.',
        base_price: 199000,
        brand_code: 'AD',
        cat_name: 'Áo Thun',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      },
      {
        name: 'Quần Kaki Nam Dáng Slimfit',
        code: 'KAKISLIM',
        slug: 'quan-kaki-nam-dang-slimfit',
        description: 'Quần kaki nam chất liệu co giãn nhẹ, tôn dáng, chuẩn mực quý ông sang trọng.',
        base_price: 420000,
        brand_code: 'MW',
        cat_name: 'Quần Kaki',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
      },
      {
        name: 'Quần Tây Nam Công Sở Cao Cấp',
        code: 'TAYOFFICE',
        slug: 'quan-tay-nam-cong-so-cao-cap',
        description: 'Quần tây nam dáng đứng không nhăn, bề mặt vải mịn sang trọng dành cho doanh nhân.',
        base_price: 480000,
        brand_code: 'ZR',
        cat_name: 'Quần Tây',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&q=80',
      },
      {
        name: 'Quần Jeans Nam Denim Co Giãn',
        code: 'JEANSDENIM',
        slug: 'quan-jeans-nam-denim-co-gian',
        description: 'Quần Jeans nam vải dệt Denim cao cấp, màu sắc cá tính, độ bền tuyệt vời.',
        base_price: 550000,
        brand_code: 'MW',
        cat_name: 'Quần Jeans',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
      },
      {
        name: 'Áo Khoác Bomber Nam Chống Nước',
        code: 'BOMBERJACK',
        slug: 'ao-khoac-bomber-nam-chong-nuoc',
        description: 'Áo khoác Bomber phong cách thể thao, lớp lót ấm áp, chống gió mưa nhẹ.',
        base_price: 650000,
        brand_code: 'NK',
        cat_name: 'Áo Khoác',
        image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80',
      },
      {
        name: 'Áo Suit Blazer Nam Lịch Lãm',
        code: 'BLAZERPRO',
        slug: 'ao-suit-blazer-nam-lich-lam',
        description: 'Áo Blazer nam may đo chuẩn phom dáng, phong cách trẻ trung, tôn nét sang trọng.',
        base_price: 890000,
        brand_code: 'ZR',
        cat_name: 'Áo Blazer',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
      },
    ];

    for (const item of mockProducts) {
      const exists = await this.productRepo.findOne({ where: { code: item.code } });
      if (!exists) {
        const brand = brandMap[item.brand_code];
        const category = catMap[item.cat_name];
        const product = await this.productRepo.save(
          this.productRepo.create({
            name: item.name,
            code: item.code,
            description: item.description,
            base_price: item.base_price,
            brand_id: brand.id,
            category_id: category.id,
            is_active: true,
          }),
        );

        // Image
        await this.imageRepo.save(
          this.imageRepo.create({
            product_id: product.id,
            url: item.image,
            sort_order: 0,
          }),
        );

        // Variants for available sizes and colors
        const targetSizes = sizes.slice(0, Math.min(sizes.length, 3));
        const targetColors = colors.slice(0, Math.min(colors.length, 2));

        for (const s of targetSizes) {
          for (const c of targetColors) {
            const sku = this.generateSku(brand.code, product.code, s.code, c.code);
            await this.variantRepo.save(
              this.variantRepo.create({
                product_id: product.id,
                size_id: s.id,
                color_id: c.id,
                sku,
                stock_quantity: 35,
                is_active: true,
              }),
            );
          }
        }
      }
    }
  }

  async seedSizesAndColors() {
    const sizes = [
      { name: 'S', code: 'S' },
      { name: 'M', code: 'M' },
      { name: 'L', code: 'L' },
      { name: 'XL', code: 'XL' },
      { name: 'XXL', code: 'XXL' },
    ];

    for (const item of sizes) {
      const exists = await this.sizeRepo.findOne({ where: { code: item.code } });
      if (!exists) {
        await this.sizeRepo.save(this.sizeRepo.create(item));
      }
    }

    const colors = [
      { name: 'Đen', code: 'BLK', hex_code: '#000000' },
      { name: 'Trắng', code: 'WHT', hex_code: '#FFFFFF' },
      { name: 'Xanh Navy', code: 'NVY', hex_code: '#000080' },
      { name: 'Ghi / Xám', code: 'GRY', hex_code: '#808080' },
    ];

    for (const item of colors) {
      const exists = await this.colorRepo.findOne({ where: { code: item.code } });
      if (!exists) {
        await this.colorRepo.save(this.colorRepo.create(item));
      }
    }
  }

  generateSku(brandCode: string, productCode: string, sizeCode: string, colorCode: string): string {
    return `${brandCode}-${productCode}-${sizeCode}-${colorCode}`.toUpperCase();
  }

  calculateEffectivePrice(basePrice: number, priceOverride?: number): number {
    if (priceOverride !== undefined && priceOverride !== null && priceOverride !== 0) {
      return Number(priceOverride);
    }
    return Number(basePrice);
  }

  async getSizes() {
    return this.sizeRepo.find();
  }

  async getColors() {
    return this.colorRepo.find();
  }

  async findAll(filter: FilterProductDto) {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 12;
      const skip = (page - 1) * limit;

      const query = this.productRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.size', 'size')
        .leftJoinAndSelect('variants.color', 'color')
        .where('product.is_active = :isActive', { isActive: true });

      if (filter.category_id) {
        query.andWhere('product.category_id = :categoryId', { categoryId: filter.category_id });
      }

      if (filter.brand_id) {
        query.andWhere('product.brand_id = :brandId', { brandId: filter.brand_id });
      }

      if (filter.min_price !== undefined) {
        query.andWhere('product.base_price >= :minPrice', { minPrice: filter.min_price });
      }

      if (filter.max_price !== undefined) {
        query.andWhere('product.base_price <= :maxPrice', { maxPrice: filter.max_price });
      }

      if (filter.size_id) {
        query.andWhere('variants.size_id = :sizeId', { sizeId: filter.size_id });
      }

      if (filter.color_id) {
        query.andWhere('variants.color_id = :colorId', { colorId: filter.color_id });
      }

      if (filter.search) {
        const cleanSearch = filter.search.trim();
        query.andWhere(
          `(
            unaccent(product.name::text) ILIKE unaccent(:search) OR
            product.code ILIKE :search OR
            unaccent(coalesce(product.description, '')::text) ILIKE unaccent(:search) OR
            unaccent(coalesce(brand.name, '')::text) ILIKE unaccent(:search) OR
            unaccent(coalesce(category.name, '')::text) ILIKE unaccent(:search)
          )`,
          { search: `%${cleanSearch}%` },
        );
      }

      query.skip(skip).take(limit).orderBy('product.created_at', 'DESC');

      const [items, total] = await query.getManyAndCount();

      const formattedItems = items.map((product) => ({
        ...product,
        variants: product.variants?.map((v) => ({
          ...v,
          effective_price: this.calculateEffectivePrice(product.base_price, v.price_override),
        })),
      }));

      return {
        data: formattedItems,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      console.error('Error in findAll:', err);
      throw new InternalServerErrorException(err.message || 'Lỗi lấy danh sách sản phẩm');
    }
  }

  async autocomplete(queryText: string, limit = 6) {
    if (!queryText || !queryText.trim()) return [];

    const clean = queryText.trim();
    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere(
        `(
          unaccent(product.name::text) ILIKE unaccent(:search) OR
          product.code ILIKE :search OR
          unaccent(coalesce(brand.name, '')::text) ILIKE unaccent(:search) OR
          unaccent(coalesce(category.name, '')::text) ILIKE unaccent(:search)
        )`,
        { search: `%${clean}%` },
      )
      .take(limit)
      .orderBy('product.name', 'ASC')
      .getMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      code: p.code,
      base_price: Number(p.base_price),
      brand_name: p.brand?.name || null,
      category_name: p.category?.name || null,
      image_url: p.images?.[0]?.url || null,
    }));
  }

  async findOne(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const product = await this.productRepo.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      relations: ['brand', 'category', 'images', 'variants', 'variants.size', 'variants.color'],
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return {
      ...product,
      variants: product.variants?.map((v) => ({
        ...v,
        effective_price: this.calculateEffectivePrice(product.base_price, v.price_override),
      })),
    };
  }

  async create(dto: CreateProductDto, performedByUserId?: string) {
    const existingCode = await this.productRepo.findOne({ where: { code: dto.code } });
    if (existingCode) {
      throw new BadRequestException('Mã sản phẩm (code) đã tồn tại');
    }

    const brand = await this.brandRepo.findOne({ where: { id: dto.brand_id } });
    if (!brand) {
      throw new NotFoundException('Thương hiệu không tồn tại');
    }

    const category = await this.categoryRepo.findOne({ where: { id: dto.category_id } });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const product = this.productRepo.create({
      name: dto.name,
      code: dto.code,
      slug: dto.slug,
      description: dto.description,
      brand_id: dto.brand_id,
      category_id: dto.category_id,
      base_price: dto.base_price,
    });

    const savedProduct = await this.productRepo.save(product);

    // Save product images
    if (dto.image_urls && dto.image_urls.length > 0) {
      const images = dto.image_urls.map((url, idx) =>
        this.imageRepo.create({
          product_id: savedProduct.id,
          url,
          sort_order: idx,
        }),
      );
      await this.imageRepo.save(images);
    }

    // Save product variants with generated SKU
    if (dto.variants && dto.variants.length > 0) {
      for (const vDto of dto.variants) {
        await this.addVariant(savedProduct.id, vDto, brand.code, savedProduct.code);
      }
    }

    const result = await this.findOne(savedProduct.id);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'CREATE_PRODUCT',
        'Product',
        savedProduct.id,
        { name: savedProduct.name, code: savedProduct.code },
      );
    }

    return result;
  }

  async addVariant(productId: string, dto: CreateVariantDto, brandCode?: string, productCode?: string, performedByUserId?: string) {
    const product = await this.productRepo.findOne({ where: { id: productId }, relations: ['brand'] });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const size = await this.sizeRepo.findOne({ where: { id: dto.size_id } });
    if (!size) throw new NotFoundException('Size không tồn tại');

    const color = await this.colorRepo.findOne({ where: { id: dto.color_id } });
    if (!color) throw new NotFoundException('Color không tồn tại');

    const bCode = brandCode || product.brand?.code || 'GEN';
    const pCode = productCode || product.code;

    const sku = this.generateSku(bCode, pCode, size.code, color.code);

    const existingVariant = await this.variantRepo.findOne({
      where: { product_id: productId, size_id: dto.size_id, color_id: dto.color_id },
    });

    if (existingVariant) {
      throw new BadRequestException(`Biến thể cặp Size ${size.name} - Màu ${color.name} đã tồn tại cho sản phẩm này`);
    }

    const variant = this.variantRepo.create({
      product_id: productId,
      size_id: dto.size_id,
      color_id: dto.color_id,
      sku,
      price_override: dto.price_override,
      stock_quantity: dto.stock_quantity,
      is_active: true,
    });

    const savedVariant = await this.variantRepo.save(variant);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'ADD_PRODUCT_VARIANT',
        'ProductVariant',
        savedVariant.id,
        { productId, sku, stock_quantity: dto.stock_quantity },
      );
    }

    return savedVariant;
  }

  async remove(id: string, performedByUserId?: string) {
    const product = await this.findOne(id);
    // Soft delete rule (spec.md 2.2): set is_active = false
    product.is_active = false;
    await this.productRepo.save(product);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'DELETE_PRODUCT',
        'Product',
        id,
        { name: product.name },
      );
    }

    return { message: 'Đã vô hiệu hóa sản phẩm thành công (Soft delete)' };
  }
}
