import { Suspense } from "react";
import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { ProductTable } from "@/features/products/components/product-table";
import { listProducts } from "@/features/products/queries";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Crackers, brands and prices"
        actions={
          <ProductFormDialog
            trigger={
              <Button>
                <PlusIcon />
                Add product
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Products />
      </Suspense>
    </>
  );
}

async function Products() {
  const products = await listProducts();
  return <ProductTable products={products} />;
}
