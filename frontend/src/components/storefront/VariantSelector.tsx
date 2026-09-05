import React, { useState, useEffect } from 'react';
import { ProductVariant, Size, Color } from '../../types';
import { Check } from 'lucide-react';
import { SizeChip } from '../common/SizeChip';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
  onColorChange?: (colorId: string | null) => void;
  onOpenSizeGuide?: () => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants = [],
  onVariantSelect,
  onColorChange,
  onOpenSizeGuide,
}) => {
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  const availableSizes: Size[] = Array.from(
    new Map(
      variants
        .filter((v) => v.size)
        .map((v) => [v.size_id, v.size!])
    ).values()
  );

  const availableColors: Color[] = Array.from(
    new Map(
      variants
        .filter((v) => v.color)
        .map((v) => [v.color_id, v.color!])
    ).values()
  );

  useEffect(() => {
    const firstInStockVariant = variants.find((v) => v.is_active && v.stock_quantity > 0);
    if (firstInStockVariant) {
      setSelectedSizeId(firstInStockVariant.size_id);
      setSelectedColorId(firstInStockVariant.color_id);
      onVariantSelect(firstInStockVariant);
      onColorChange?.(firstInStockVariant.color_id);
    } else if (variants.length > 0) {
      const firstVariant = variants[0];
      setSelectedColorId(firstVariant.color_id);
      onColorChange?.(firstVariant.color_id);
    }
  }, [variants]);

  const handleSizeClick = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    findAndNotifyVariant(sizeId, selectedColorId);
  };

  const handleColorClick = (colorId: string) => {
    setSelectedColorId(colorId);
    onColorChange?.(colorId);
    findAndNotifyVariant(selectedSizeId, colorId);
  };

  const findAndNotifyVariant = (sizeId: string | null, colorId: string | null) => {
    if (!sizeId || !colorId) {
      onVariantSelect(null);
      return;
    }

    const matchedVariant = variants.find(
      (v) => v.size_id === sizeId && v.color_id === colorId && v.is_active
    );

    if (matchedVariant && matchedVariant.stock_quantity > 0) {
      onVariantSelect(matchedVariant);
    } else {
      onVariantSelect(null);
    }
  };

  const isSizeInStock = (sizeId: string): boolean => {
    if (!selectedColorId) {
      return variants.some((v) => v.size_id === sizeId && v.is_active && v.stock_quantity > 0);
    }
    return variants.some(
      (v) => v.size_id === sizeId && v.color_id === selectedColorId && v.is_active && v.stock_quantity > 0
    );
  };

  const isColorInStock = (colorId: string): boolean => {
    if (!selectedSizeId) {
      return variants.some((v) => v.color_id === colorId && v.is_active && v.stock_quantity > 0);
    }
    return variants.some(
      (v) => v.size_id === selectedSizeId && v.color_id === colorId && v.is_active && v.stock_quantity > 0
    );
  };

  const selectedColor = availableColors.find((c) => c.id === selectedColorId);
  const selectedSize = availableSizes.find((s) => s.id === selectedSizeId);

  return (
    <div className="space-y-5 font-sans">
      {/* Color Selection */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-bold text-slate-900 tracking-wide">Màu sắc:</span>
          <span className="text-xs font-semibold text-slate-700">
            {selectedColor ? selectedColor.name : 'Chọn màu'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {availableColors.map((color) => {
            const inStock = isColorInStock(color.id);
            const isSelected = selectedColorId === color.id;
            const isWhiteOrLight =
              color.hex_code &&
              (color.hex_code.toLowerCase() === '#ffffff' ||
                color.hex_code.toLowerCase() === '#fff' ||
                color.name.toLowerCase().includes('trắng'));

            return (
              <button
                key={color.id}
                type="button"
                disabled={!inStock}
                onClick={() => handleColorClick(color.id)}
                className={`group relative flex items-center justify-center p-0.5 rounded-xl transition-all ${
                  !inStock
                    ? 'opacity-35 cursor-not-allowed'
                    : isSelected
                    ? 'ring-2 ring-slate-900 ring-offset-2 scale-105 shadow-xs'
                    : 'hover:ring-1 hover:ring-slate-300'
                }`}
                title={`${color.name} ${!inStock ? '(Hết hàng)' : ''}`}
              >
                <div
                  className="w-11 h-7 rounded-lg border border-slate-300 flex items-center justify-center overflow-hidden shadow-2xs"
                  style={{ backgroundColor: color.hex_code || '#E2E8F0' }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[2.5] ${
                        isWhiteOrLight ? 'text-slate-900' : 'text-white drop-shadow-xs'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 tracking-wide">Kích thước:</span>
            <span className="text-xs font-semibold text-slate-700">
              {selectedSize ? selectedSize.code || selectedSize.name : 'Chọn size'}
            </span>
          </div>
          {onOpenSizeGuide && (
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
            >
              Hướng dẫn chọn size
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const inStock = isSizeInStock(size.id);
            const isSelected = selectedSizeId === size.id;

            return (
              <button
                key={size.id}
                type="button"
                disabled={!inStock}
                onClick={() => handleSizeClick(size.id)}
                className={`min-w-[50px] h-10 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  !inStock
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed line-through border border-dashed border-slate-200'
                    : isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {size.code || size.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
