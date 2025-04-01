# E-commerce Platform Architecture Document

## 1\. System Overview

This multi-tenant e-commerce platform enables the creation and management of multiple stores from a central admin interface. Each store supports multiple languages (English, Spanish, Portuguese) and currencies, with a configuration-based approach for easy customization. The platform is designed for high-value, low-volume products (approximately 50-100 customers per month) with comprehensive product management, order processing, and customer engagement features.

## 2\. Technology Stack

- **Frontend Framework**: Remix on Cloudflare Pages  
- **Backend**: Cloudflare Workers (serverless)  
- **Database**: Cloudflare D1 (serverless SQLite)  
- **Authentication**: Firebase Authentication  
- **Image Storage**: Cloudflare Images  
- **Styling**: Chakra UI v3  
- **Payments**: Stripe Elements \+ Webhooks  
- **Email**: Cloudflare Email Workers  
- **Search**: D1 full-text search capabilities  
- **Analytics**: Google Analytics integration  
- **Error Monitoring**: Sentry

## 3\. Core Components

### 3.1 Multi-tenant Store System

- Domain/subdomain routing for different stores  
- Theme configuration system  
- Store-specific settings management  
- Resource allocation and limitations per tenant

### 3.2 Product Management System

- Product catalog with multi-language support  
- Category hierarchy  
- Product variants and options  
- Image management  
- Inventory tracking  
- Import/export functionality  
- Supplier scraping integration

### 3.3 Shopping Cart & Checkout

- Session-based cart system  
- Guest checkout with optional account creation  
- Multi-step checkout process  
- Payment integration via Stripe  
- Order processing and confirmation  
- Discount application

### 3.4 Customer Account System

- Firebase Authentication integration  
- Order history  
- Address book management  
- Wishlist functionality  
- Returns management

### 3.5 Admin Interface

- Store management dashboard  
- Product/inventory management  
- Order processing  
- Sales reporting  
- Customer management  
- Configuration interface  
- Multi-language support

### 3.6 SEO & Marketing

- Meta tag management  
- Structured data implementation  
- Sitemap generation  
- URL optimization  
- Redirect management  
- Content page creation

### 3.7 Content Management

- Static page builder  
- Blog functionality  
- Landing page templates  
- Navigation management  
- Theme asset management

### 3.8 Promotions System

- Discount rules engine  
- Coupon code management  
- Automatic promotions  
- Tiered discounts  
- Bundle offers  
- BOGO implementation

### 3.9 Returns & Refunds

- Customer-initiated returns  
- Admin approval workflow  
- RMA generation  
- Refund processing  
- Inventory adjustments  
- Store credit management

## 4\. Database Schema

### Core Store & Configuration

CREATE TABLE stores (

  id TEXT PRIMARY KEY,

  name TEXT NOT NULL,

  slug TEXT UNIQUE NOT NULL,

  custom\_domain TEXT UNIQUE,

  config TEXT NOT NULL, \-- JSON blob for theme/layout config

  default\_language TEXT NOT NULL DEFAULT 'en',

  supported\_languages TEXT NOT NULL DEFAULT 'en,es,pt',

  supported\_currencies TEXT NOT NULL DEFAULT 'USD',

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);

CREATE TABLE store\_limits (

  store\_id TEXT PRIMARY KEY,

  max\_products INTEGER DEFAULT 10000,

  max\_storage\_gb INTEGER DEFAULT 10,

  max\_bandwidth\_gb INTEGER DEFAULT 100,

  max\_monthly\_orders INTEGER DEFAULT 1000,

  current\_product\_count INTEGER DEFAULT 0,

  current\_storage\_used\_gb REAL DEFAULT 0,

  current\_bandwidth\_used\_gb REAL DEFAULT 0,

  current\_monthly\_orders INTEGER DEFAULT 0,

  limits\_last\_reset TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE exchange\_rates (

  currency TEXT PRIMARY KEY,

  rate\_to\_usd REAL NOT NULL,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);

### Product Management

CREATE TABLE categories (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  parent\_id TEXT,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id),

  FOREIGN KEY (parent\_id) REFERENCES categories(id)

);

CREATE TABLE category\_translations (

  category\_id TEXT NOT NULL,

  language TEXT NOT NULL,

  name TEXT NOT NULL,

  description TEXT,

  slug TEXT NOT NULL,

  meta\_title TEXT,

  meta\_description TEXT,

  PRIMARY KEY (category\_id, language),

  FOREIGN KEY (category\_id) REFERENCES categories(id)

);

CREATE TABLE products (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  sku TEXT NOT NULL,

  price\_usd REAL NOT NULL,

  compare\_at\_price\_usd REAL,

  cost\_price\_usd REAL,

  inventory INTEGER DEFAULT 0,

  low\_inventory\_threshold INTEGER DEFAULT 5,

  weight REAL,

  dimensions TEXT,

  visible BOOLEAN DEFAULT TRUE,

  featured BOOLEAN DEFAULT FALSE,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id),

  UNIQUE(store\_id, sku)

);

CREATE TABLE product\_translations (

  product\_id TEXT NOT NULL,

  language TEXT NOT NULL,

  name TEXT NOT NULL,

  description TEXT,

  slug TEXT NOT NULL,

  meta\_title TEXT,

  meta\_description TEXT,

  PRIMARY KEY (product\_id, language),

  FOREIGN KEY (product\_id) REFERENCES products(id)

);

CREATE TABLE product\_categories (

  product\_id TEXT NOT NULL,

  category\_id TEXT NOT NULL,

  PRIMARY KEY (product\_id, category\_id),

  FOREIGN KEY (product\_id) REFERENCES products(id),

  FOREIGN KEY (category\_id) REFERENCES categories(id)

);

CREATE TABLE product\_images (

  id TEXT PRIMARY KEY,

  product\_id TEXT NOT NULL,

  cloudflare\_image\_id TEXT NOT NULL,

  position INTEGER DEFAULT 0,

  alt\_text TEXT,

  FOREIGN KEY (product\_id) REFERENCES products(id)

);

CREATE TABLE product\_options (

  id TEXT PRIMARY KEY,

  product\_id TEXT NOT NULL,

  name TEXT NOT NULL,

  values TEXT NOT NULL,

  FOREIGN KEY (product\_id) REFERENCES products(id)

);

CREATE TABLE product\_variants (

  id TEXT PRIMARY KEY,

  product\_id TEXT NOT NULL,

  sku TEXT NOT NULL,

  price\_usd REAL NOT NULL,

  inventory INTEGER DEFAULT 0,

  options TEXT NOT NULL,

  FOREIGN KEY (product\_id) REFERENCES products(id)

);

### SEO Management

CREATE TABLE seo\_configurations (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  entity\_type TEXT NOT NULL, \-- 'product', 'category', 'page'

  entity\_id TEXT NOT NULL,

  language TEXT NOT NULL,

  meta\_title TEXT,

  meta\_description TEXT,

  og\_title TEXT,

  og\_description TEXT,

  og\_image TEXT,

  schema\_data TEXT, \-- JSON structured data

  canonical\_url TEXT,

  FOREIGN KEY (store\_id) REFERENCES stores(id),

  UNIQUE(store\_id, entity\_type, entity\_id, language)

);

CREATE TABLE sitemap\_configurations (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  enabled BOOLEAN DEFAULT TRUE,

  auto\_generation\_frequency TEXT DEFAULT 'daily',

  include\_products BOOLEAN DEFAULT TRUE,

  include\_categories BOOLEAN DEFAULT TRUE,

  include\_pages BOOLEAN DEFAULT TRUE,

  custom\_urls TEXT, \-- JSON array of additional URLs

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE url\_redirects (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  source\_url TEXT NOT NULL,

  target\_url TEXT NOT NULL,

  redirect\_type INTEGER DEFAULT 301,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id),

  UNIQUE(store\_id, source\_url)

);

### Shopping & Checkout

CREATE TABLE carts (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  customer\_id TEXT,

  session\_id TEXT NOT NULL,

  currency TEXT NOT NULL DEFAULT 'USD',

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE cart\_items (

  id TEXT PRIMARY KEY,

  cart\_id TEXT NOT NULL,

  product\_id TEXT NOT NULL,

  variant\_id TEXT,

  quantity INTEGER NOT NULL DEFAULT 1,

  price\_at\_add REAL NOT NULL,

  FOREIGN KEY (cart\_id) REFERENCES carts(id),

  FOREIGN KEY (product\_id) REFERENCES products(id),

  FOREIGN KEY (variant\_id) REFERENCES product\_variants(id)

);

CREATE TABLE orders (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  customer\_id TEXT,

  order\_number TEXT NOT NULL,

  status TEXT NOT NULL,

  currency TEXT NOT NULL DEFAULT 'USD',

  subtotal REAL NOT NULL,

  shipping\_cost REAL NOT NULL DEFAULT 0,

  tax\_amount REAL NOT NULL DEFAULT 0,

  discount\_amount REAL NOT NULL DEFAULT 0,

  total REAL NOT NULL,

  shipping\_address TEXT NOT NULL,

  billing\_address TEXT NOT NULL,

  payment\_method TEXT NOT NULL,

  payment\_intent\_id TEXT,

  notes TEXT,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE order\_items (

  id TEXT PRIMARY KEY,

  order\_id TEXT NOT NULL,

  product\_id TEXT NOT NULL,

  variant\_id TEXT,

  sku TEXT NOT NULL,

  name TEXT NOT NULL,

  price REAL NOT NULL,

  quantity INTEGER NOT NULL,

  subtotal REAL NOT NULL,

  FOREIGN KEY (order\_id) REFERENCES orders(id)

);

CREATE TABLE order\_history (

  id TEXT PRIMARY KEY,

  order\_id TEXT NOT NULL,

  status TEXT NOT NULL,

  notes TEXT,

  created\_by TEXT,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (order\_id) REFERENCES orders(id)

);

### Customer Management

CREATE TABLE customer\_profiles (

  id TEXT PRIMARY KEY, \-- Firebase Auth UID

  email TEXT NOT NULL,

  first\_name TEXT,

  last\_name TEXT,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  last\_login TIMESTAMP

);

CREATE TABLE customer\_addresses (

  id TEXT PRIMARY KEY,

  customer\_id TEXT NOT NULL,

  address\_type TEXT NOT NULL,

  is\_default BOOLEAN DEFAULT FALSE,

  address\_line1 TEXT NOT NULL,

  address\_line2 TEXT,

  city TEXT NOT NULL,

  state TEXT,

  postal\_code TEXT NOT NULL,

  country TEXT NOT NULL,

  FOREIGN KEY (customer\_id) REFERENCES customer\_profiles(id)

);

### Promotions & Discounts

CREATE TABLE discounts (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  name TEXT NOT NULL,

  description TEXT,

  discount\_type TEXT NOT NULL,

  active BOOLEAN DEFAULT TRUE,

  code TEXT,

  minimum\_order\_amount REAL,

  maximum\_discount\_amount REAL,

  usage\_limit\_per\_customer INTEGER,

  usage\_limit\_total INTEGER,

  usage\_count INTEGER DEFAULT 0,

  starts\_at TIMESTAMP,

  ends\_at TIMESTAMP,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE discount\_rules (

  id TEXT PRIMARY KEY,

  discount\_id TEXT NOT NULL,

  rule\_type TEXT NOT NULL,

  operator TEXT NOT NULL,

  value TEXT NOT NULL,

  FOREIGN KEY (discount\_id) REFERENCES discounts(id)

);

CREATE TABLE discount\_actions (

  id TEXT PRIMARY KEY,

  discount\_id TEXT NOT NULL,

  action\_type TEXT NOT NULL,

  action\_value TEXT NOT NULL,

  FOREIGN KEY (discount\_id) REFERENCES discounts(id)

);

CREATE TABLE discount\_usage (

  id TEXT PRIMARY KEY,

  discount\_id TEXT NOT NULL,

  customer\_id TEXT,

  order\_id TEXT NOT NULL,

  used\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  amount\_applied REAL NOT NULL,

  FOREIGN KEY (discount\_id) REFERENCES discounts(id),

  FOREIGN KEY (order\_id) REFERENCES orders(id)

);

### Content Management

CREATE TABLE pages (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  page\_type TEXT NOT NULL,

  template TEXT NOT NULL,

  status TEXT NOT NULL,

  published\_at TIMESTAMP,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE page\_translations (

  page\_id TEXT NOT NULL,

  language TEXT NOT NULL,

  title TEXT NOT NULL,

  slug TEXT NOT NULL,

  content TEXT,

  meta\_title TEXT,

  meta\_description TEXT,

  PRIMARY KEY (page\_id, language),

  FOREIGN KEY (page\_id) REFERENCES pages(id)

);

CREATE TABLE navigation\_menus (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  name TEXT NOT NULL,

  location TEXT NOT NULL,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE navigation\_items (

  id TEXT PRIMARY KEY,

  menu\_id TEXT NOT NULL,

  parent\_id TEXT,

  title TEXT NOT NULL,

  link\_type TEXT NOT NULL,

  link\_value TEXT NOT NULL,

  position INTEGER NOT NULL,

  FOREIGN KEY (menu\_id) REFERENCES navigation\_menus(id),

  FOREIGN KEY (parent\_id) REFERENCES navigation\_items(id)

);

CREATE TABLE theme\_assets (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  asset\_type TEXT NOT NULL,

  filename TEXT NOT NULL,

  path TEXT NOT NULL,

  size INTEGER NOT NULL,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

### Returns & Refunds

CREATE TABLE return\_requests (

  id TEXT PRIMARY KEY,

  order\_id TEXT NOT NULL,

  customer\_id TEXT,

  status TEXT NOT NULL,

  reason TEXT NOT NULL,

  request\_date TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  resolution\_date TIMESTAMP,

  refund\_amount REAL,

  refund\_method TEXT,

  notes TEXT,

  FOREIGN KEY (order\_id) REFERENCES orders(id)

);

CREATE TABLE return\_items (

  id TEXT PRIMARY KEY,

  return\_id TEXT NOT NULL,

  order\_item\_id TEXT NOT NULL,

  quantity INTEGER NOT NULL,

  condition TEXT NOT NULL,

  restock BOOLEAN DEFAULT TRUE,

  FOREIGN KEY (return\_id) REFERENCES return\_requests(id),

  FOREIGN KEY (order\_item\_id) REFERENCES order\_items(id)

);

CREATE TABLE store\_credits (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  customer\_id TEXT NOT NULL,

  amount REAL NOT NULL,

  remaining\_amount REAL NOT NULL,

  reason TEXT,

  expires\_at TIMESTAMP,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

### Import & Integration

CREATE TABLE import\_jobs (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  type TEXT NOT NULL,

  status TEXT NOT NULL,

  source TEXT,

  options TEXT,

  stats TEXT,

  created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

  completed\_at TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

CREATE TABLE import\_errors (

  id TEXT PRIMARY KEY,

  import\_job\_id TEXT NOT NULL,

  row\_number INTEGER,

  error\_message TEXT NOT NULL,

  raw\_data TEXT,

  FOREIGN KEY (import\_job\_id) REFERENCES import\_jobs(id)

);

CREATE TABLE suppliers (

  id TEXT PRIMARY KEY,

  store\_id TEXT NOT NULL,

  name TEXT NOT NULL,

  url TEXT NOT NULL,

  scraping\_config TEXT NOT NULL,

  credentials TEXT,

  schedule TEXT,

  last\_scrape\_at TIMESTAMP,

  FOREIGN KEY (store\_id) REFERENCES stores(id)

);

## 5\. Data Isolation Strategy

### Multi-tenant Architecture

- Each table includes a `store_id` foreign key for tenant isolation  
- Database middleware automatically filters queries by store\_id  
- Resource limits enforced through the store\_limits table  
- Cloudflare Workers environment isolation per tenant

### Resource Management

- Soft and hard limits on products, storage, bandwidth, and orders  
- Usage tracking via background jobs  
- Admin dashboard for monitoring resource usage  
- Rate limiting on a per-store basis for API requests

## 6\. SEO Implementation

### Per-Store SEO Features

- Dynamically generated sitemaps for each store  
- Per-language URL slugs for products, categories, and pages  
- Schema.org structured data for products, breadcrumbs, and organizations  
- Customizable meta tags for all content types  
- Open Graph and Twitter Card support  
- Canonical URL management for multi-language content  
- 301/302 redirect management

### Automatic Optimization

- Sitemap generation and submission  
- Dynamic robots.txt with store-specific rules  
- Image optimization and alt text management  
- Structured data validation  
- Mobile-friendly testing

## 7\. Testing & Quality Assurance

### Testing Layers

- Unit testing with Vitest for isolated components  
- Integration testing for API endpoints and data flows  
- End-to-end testing with Cypress for critical user journeys  
- Performance testing with Lighthouse and k6  
- Accessibility testing with axe-core

### CI/CD Pipeline

- Automated testing on pull requests  
- Staging environments for QA  
- Canary deployments for production  
- Rollback capabilities

### Monitoring

- Error tracking with Sentry  
- Real-user monitoring with Cloudflare Analytics  
- Synthetic monitoring for critical flows  
- Performance monitoring and alerting

## 8\. Accessibility Compliance

### WCAG 2.1 Level AA Implementation

- Keyboard navigation support  
- Screen reader compatibility  
- Sufficient color contrast  
- Text resizing support  
- Form labeling and error identification  
- ARIA attributes implementation  
- Focus management for dynamic content

### Development Process

- Accessibility checklist for developers  
- Automated testing with axe-core  
- Regular manual testing with screen readers  
- Accessibility audit before major releases

## 9\. Responsive Design

- Mobile-first design approach  
- Fluid layouts using CSS Grid and Flexbox  
- Responsive images with Cloudflare Images  
- Touch-friendly interface elements  
- Optimization for various viewport sizes

## 10\. Deployment Architecture

- Cloudflare Pages for frontend hosting  
- Cloudflare Workers for serverless backend functions  
- Cloudflare D1 for database storage  
- Custom domains via Cloudflare DNS  
- Global CDN distribution

## 11\. Security Architecture

- Firebase Authentication for secure user management  
- JWT-based authorization flow  
- HTTPS-only communication  
- Content Security Policy implementation  
- XSS and CSRF protection  
- PCI compliance for payment handling  
- Data encryption for sensitive information  
- Regular security scanning

