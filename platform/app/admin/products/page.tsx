import Link from 'next/link';
import { ArrowUpRight, Package } from 'lucide-react';
import { products } from '@/lib/product-catalog';
export const metadata = { title: 'Products | Aksen Workspace' };

export default function AdminProductsPage() {
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>WEBSITE & PRODUCTS</small>
          <h1>Products</h1>
          <p>
            Review the product collection, availability labels and public
            destinations.
          </p>
        </div>
        <Link href="/products">
          View product collection <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="admin-product-grid">
        {products.map((product) => (
          <article
            className="admin-panel admin-product-card"
            key={product.slug}
          >
            <div className="admin-product-top">
              <Package size={23} />
              <span>{product.status}</span>
            </div>
            <small>{product.category}</small>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <ul>
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="admin-product-actions">
              {/* A product with no public address has no page to open. */}
              {product.href ? (
                <Link href={product.href}>
                  Open public page <ArrowUpRight size={16} />
                </Link>
              ) : (
                <span>No public address yet</span>
              )}
              <Link
                href={`/admin/pipeline?q=${encodeURIComponent(product.name)}`}
                prefetch={false}
              >
                View product enquiries <ArrowUpRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <aside className="admin-info-note">
        <strong>About this collection</strong>
        <p>
          These listings use the website’s product catalogue. Names, features
          and availability are currently updated in the site source; this
          overview does not publish changes.
        </p>
      </aside>
    </section>
  );
}
