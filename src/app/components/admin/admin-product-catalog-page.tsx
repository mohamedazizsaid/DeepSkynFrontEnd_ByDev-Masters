import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

export function AdminProductCatalogPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [files, setFiles] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await adminService.getScrapedFiles();
      const list = Array.isArray(res) ? res : res.files || [];
      setFiles(list);
      if (list.length > 0 && !selectedFile) {
        setSelectedFile(list[0]);
        await loadProducts(list[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (fileName: string) => {
    try {
      const res = await adminService.getScrapedData(fileName);
      setProducts(Array.isArray(res) ? res : res.products || []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileChange = async (file: string) => {
    setSelectedFile(file);
    await loadProducts(file);
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await adminService.triggerScrape();
      await loadFiles();
    } finally {
      setScraping(false);
    }
  };

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-products-title" aria-describedby="admin-products-live" aria-busy={loading || scraping}>
      <p id="admin-products-live" className="sr-only" role="status" aria-live="polite">
        {scraping ? adminLocale.products.scraping : loading ? adminLocale.common.loading : adminLocale.products.title}
      </p>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 id="admin-products-title" className="text-3xl font-bold">{adminLocale.products.title}</h1>
          <p className="text-[#6B7280]">{adminLocale.products.subtitle}</p>
        </div>
        <Button onClick={handleScrape} disabled={scraping} aria-label={adminLocale.products.triggerScrape}>
          {scraping ? adminLocale.products.scraping : adminLocale.products.triggerScrape}
        </Button>
      </div>

      {/* File selector */}
      <Card>
        <div className="flex gap-3 items-center flex-wrap">
          <label htmlFor="products-data-file" className="text-sm font-medium text-[#1B3A5C]">{adminLocale.products.dataFile}:</label>
          <select
            id="products-data-file"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2 flex-1 min-w-[280px]"
            value={selectedFile}
            onChange={(e) => handleFileChange(e.target.value)}
          >
            {files.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <span className="text-sm text-[#6B7280]">{files.length} {adminLocale.products.filesAvailable}</span>
        </div>
      </Card>

      {/* Product grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list" aria-label={adminLocale.products.title}>
        {products.map((product: any, idx: number) => (
          <Card key={idx} role="listitem">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name || product.title || adminLocale.products.productImageAlt}
                className="w-full h-40 object-contain rounded-xl mb-3 bg-[#F9FAFB] dark:bg-gray-900"
              />
            )}
            <h4 className="font-semibold text-[#1B3A5C] mb-1 line-clamp-2">{product.name || product.title || adminLocale.products.unnamedProduct}</h4>
            {product.brand && <p className="text-xs text-[#0EA5E9] mb-1">{product.brand}</p>}
            {product.price && (
              <p className="text-sm font-bold text-[#1B3A5C]">{product.price}</p>
            )}
            {product.description && (
              <p className="text-xs text-[#6B7280] mt-1 line-clamp-3">{product.description}</p>
            )}
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0EA5E9] underline mt-2 inline-block"
              >
                {adminLocale.products.viewSource}
              </a>
            )}
          </Card>
        ))}
      </div>

      {!products.length && !loading && (
        <Card>
          <p className="text-[#6B7280] text-center py-6" role="status">
            {selectedFile ? adminLocale.products.noProductsInFile : adminLocale.products.selectDataFile}
          </p>
        </Card>
      )}
      {loading && (
        <Card>
          <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.common.loading}</p>
        </Card>
      )}
    </main>
  );
}
