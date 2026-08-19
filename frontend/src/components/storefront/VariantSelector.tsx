import React, { useState, useEffect } from 'react';
import { ProductVariant, Size, Color } from '../../types';
import { Check } from 'lucide-react';
import { SizeChip } from '../common/SizeChip';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants = [],
  onVariantSelect,
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
    }
  }, [variants]);

  const handleSizeClick = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    findAndNotifyVariant(sizeId, selectedColorId);
  };

  const handleColorClick = (colorId: string) => {
    setSelectedColorId(colorId);
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

  return (
    <div className="space-y-6 py-5 border-y border-line font-sans">
      {/* Color Selection */}
      <div>
        <div className="flex justify-between items-baseline mb-3">
          <label className="font-display font-medium text-sm text-ink">Màu sắc</label>
          <span className="font-mono text-xs text-ink-soft">
            {selectedColorId
              ? availableColors.find((c) => c.id === selectedColorId)?.name
              : 'Chọn màu'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const inStock = isColorInStock(color.id);
            const isSelected = selectedColorId === color.id;

            return (
              <button
                key={color.id}
                type="button"
                disabled={!inStock}
                onClick={() => handleColorClick(color.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono rounded-lg border transition-all ${
                  !inStock
                    ? 'border-line bg-bg-alt text-ink-soft/50 cursor-not-allowed opacity-40 line-through'
                    : isSelected
                    ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                    : 'border-line bg-card text-ink hover:border-accent'
                }`}
              >
                {color.hex_code && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-line shadow-inner"
                    style={{ backgroundColor: color.hex_code }}
                  />
                )}
                <span>{color.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
                {!inStock && <span className="text-[10px] text-ink-soft italic ml-1">(Hết)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <div className="flex justify-between items-baseline mb-3">
          <label className="font-display font-medium text-sm text-ink">Kích thước (Size)</label>
          <span className="font-mono text-xs text-accent">Bảng quy đổi size chuẩn</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {availableSizes.map((size) => {
            const inStock = isSizeInStock(size.id);
            const isSelected = selectedSizeId === size.id;

            return (
              <SizeChip
                key={size.id}
                label={size.code || size.name}
                selected={isSelected}
                disabled={!inStock}
                onClick={() => handleSizeClick(size.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
