import { useState, useMemo, useEffect } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProductOption {
  value: string;
  label: string;
}

interface NestedProductSelectProps {
  productCategory: string;
  selectedProduct: string;
  onSelect: (category: string, product: string) => void;
  productsByCategory: Record<string, ProductOption[]>;
  categoryOptions: { value: string; label: string }[];
}

export function NestedProductSelect({
  productCategory,
  selectedProduct,
  onSelect,
  productsByCategory,
  categoryOptions,
}: NestedProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Reset active category when opening
  useEffect(() => {
    if (open) {
      setActiveCategory(productCategory || categoryOptions[0]?.value || "");
      setSearchValue("");
    }
  }, [open, productCategory, categoryOptions]);

  // Flatten all products with category info for search
  const allProducts = useMemo(() => {
    const products: { category: string; categoryLabel: string; value: string; label: string }[] = [];
    categoryOptions.forEach((cat) => {
      const categoryProducts = productsByCategory[cat.value] || [];
      categoryProducts.forEach((product) => {
        products.push({
          category: cat.value,
          categoryLabel: cat.label,
          value: product.value,
          label: product.label,
        });
      });
    });
    return products;
  }, [categoryOptions, productsByCategory]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchValue) {
      // No search - show products of active category
      return productsByCategory[activeCategory] || [];
    }
    
    const search = searchValue.toLowerCase();
    const matched = allProducts.filter((p) =>
      p.label.toLowerCase().includes(search)
    );
    return matched;
  }, [searchValue, activeCategory, allProducts, productsByCategory]);

  // Auto-highlight category when searching
  useEffect(() => {
    if (searchValue && filteredProducts.length > 0) {
      // Get the first matched product's category
      const firstMatch = filteredProducts[0];
      if ('category' in firstMatch) {
        setActiveCategory((firstMatch as any).category);
      }
    }
  }, [searchValue, filteredProducts]);

  // Get display label
  const getDisplayLabel = () => {
    if (!productCategory || !selectedProduct) {
      return "เลือกประเภทสินค้า / สินค้า";
    }
    const categoryLabel = categoryOptions.find((c) => c.value === productCategory)?.label || productCategory;
    const productLabel = productsByCategory[productCategory]?.find((p) => p.value === selectedProduct)?.label || selectedProduct;
    return `${categoryLabel} > ${productLabel}`;
  };

  const handleSelect = (category: string, productValue: string) => {
    onSelect(category, productValue);
    setOpen(false);
    setSearchValue("");
  };

  // Get products to display based on search or active category
  const displayProducts = useMemo(() => {
    if (searchValue) {
      // When searching, show all matched products with category info
      return filteredProducts;
    }
    // Otherwise show products of active category
    return (productsByCategory[activeCategory] || []).map(p => ({
      ...p,
      category: activeCategory,
      categoryLabel: categoryOptions.find(c => c.value === activeCategory)?.label || activeCategory
    }));
  }, [searchValue, filteredProducts, activeCategory, productsByCategory, categoryOptions]);

  // Categories that have matching products when searching
  const matchedCategories = useMemo(() => {
    if (!searchValue) return new Set(categoryOptions.map(c => c.value));
    return new Set(filteredProducts.map((p: any) => p.category));
  }, [searchValue, filteredProducts, categoryOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-10",
            !productCategory && "text-muted-foreground"
          )}
        >
          <span className="truncate">{getDisplayLabel()}</span>
          <ChevronRight className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-90")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start" sideOffset={4}>
        {/* Search Box */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex max-h-[300px]">
          {/* Left Column - Categories */}
          <div className="w-[180px] border-r overflow-y-auto bg-muted/30">
            {categoryOptions.map((category) => {
              const isActive = activeCategory === category.value;
              const hasMatch = matchedCategories.has(category.value);
              
              return (
                <button
                  key={category.value}
                  onClick={() => {
                    setActiveCategory(category.value);
                    if (searchValue) setSearchValue(""); // Clear search when clicking category
                  }}
                  disabled={searchValue ? !hasMatch : false}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors",
                    isActive && "bg-primary/10 text-primary font-medium border-r-2 border-primary",
                    !isActive && "hover:bg-muted/50",
                    searchValue && !hasMatch && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="truncate">{category.label}</span>
                  <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50", isActive && "opacity-100")} />
                </button>
              );
            })}
          </div>

          {/* Right Column - Products */}
          <div className="flex-1 overflow-y-auto">
            {displayProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                ไม่พบสินค้า
              </div>
            ) : (
              <div className="py-1">
                {displayProducts.map((product: any) => {
                  const isSelected =
                    productCategory === product.category &&
                    selectedProduct === product.value;
                  
                  return (
                    <button
                      key={`${product.category}-${product.value}`}
                      onClick={() => handleSelect(product.category, product.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                        "hover:bg-primary/5",
                        isSelected && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{product.label}</span>
                      {searchValue && (
                        <span className="text-xs text-muted-foreground">
                          {product.categoryLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
