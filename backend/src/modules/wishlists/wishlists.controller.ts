import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  async getWishlist(@Request() req) {
    return this.wishlistsService.getUserWishlist(req.user.id);
  }

  @Post('toggle/:productId')
  async toggleWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistsService.toggleWishlist(req.user.id, productId);
  }

  @Get('status/:productId')
  async checkStatus(@Request() req, @Param('productId') productId: string) {
    return this.wishlistsService.checkWishlistStatus(req.user.id, productId);
  }
}
