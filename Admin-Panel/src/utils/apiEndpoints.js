/**
 * Returns the correct API endpoint based on the logged-in user's role.
 * All endpoints verified against the backend routes.
 */
export function getEndpoints(role) {
  switch (role) {

    /* ─────────── WHOLESALER ─────────── */
    case 'wholesaler':
      return {
        // Products — must pass ?role=wholesaler so the controller knows which products to return
        getProducts: '/api/wholesaler/get-products?role=wholesaler',
        createProduct: '/api/wholesaler/create-product',
        updateProduct: (id) => `/api/wholesaler/update-products/${id}`,
        deleteProduct: (id) => `/api/wholesaler/delete-product/${id}`,

        // Orders
        getOrders: '/api/wholesaler/get-orders',

        // Categories
        getCategories: '/api/wholesaler/get-category',

        // Brands
        getBrands: '/api/wholesaler/get-brands',

        // Blogs
        getBlogs: '/api/wholesaler/get-blogs',
        createBlog: '/api/wholesaler/create-blog',
        updateBlog: (id) => `/api/wholesaler/update-blog/${id}`,
        deleteBlog: (id) => `/api/wholesaler/delete-blog/${id}`,

        // Reviews
        getProductsWithReviews: '/api/wholesaler/products-with-reviews',
        getProductReviews: (id) => `/api/wholesaler/product-reviews/${id}`,

        // Newsletter
        getNewsletters: '/api/wholesaler/newsletters',
        deleteNewsletter: (id) => `/api/wholesaler/newsletter/${id}`,
      };

    /* ─────────── RETAILER ─────────── */
    case 'retailer':
      return {
        // Products
        getProducts: '/api/retailer/get-products',
        createProduct: '/api/retailer/create-product',
        updateProduct: (id) => `/api/retailer/update-products/${id}`,
        deleteProduct: (id) => `/api/retailer/delete-product/${id}`,

        // Orders
        getOrders: '/api/retailer/get-orders',

        // Categories
        getCategories: '/api/retailer/get-category',

        // Brands
        getBrands: '/api/retailer/get-brands',

        // Blogs
        getBlogs: '/api/retailer/get-blogs',
        createBlog: '/api/retailer/create-blog',
        updateBlog: (id) => `/api/retailer/update-blog/${id}`,
        deleteBlog: (id) => `/api/retailer/delete-blog/${id}`,

        // Reviews
        getProductsWithReviews: '/api/retailer/products-with-reviews',
        getProductReviews: (id) => `/api/retailer/product-reviews/${id}`,

        // Newsletter
        getNewsletters: '/api/retailer/newsletters',
        deleteNewsletter: (id) => `/api/retailer/newsletter/${id}`,
      };

    /* ─────────── ADMIN (default) ─────────── */
    case 'admin':
    default:
      return {
        // Products / Inventory
        getProducts: '/api/admin/get-products',
        createProduct: '/api/admin/create-product',
        updateProduct: (id) => `/api/admin/update-products/${id}`,
        deleteProduct: (id) => `/api/admin/delete-product/${id}`,

        // Orders (all)
        getOrders: '/api/user/purchases',

        // Categories
        getCategories: '/api/admin/get-category',
        getRetailerCategories: '/api/admin/get-retailer-category',

        // Brands
        getBrands: '/api/admin/get-brands',

        // Blogs
        getBlogs: '/api/wholesaler/get-all-blogs',
        deleteBlog: (id) => `/api/wholesaler/delete-blog/${id}`,

        // Reviews
        getProductsWithReviews: '/api/admin/products-with-reviews',
        getProductReviews: (id) => `/api/admin/product-reviews/${id}`,

        // Newsletter
        getNewsletters: '/api/admin/newsletters',
        deleteNewsletter: (id) => `/api/admin/newsletter/${id}`,
        editNewsletter: (id) => `/api/admin/newsletter/${id}`,

        // Users
        getAllUsers: '/api/user/users-with-forms',
        deleteUser: (id) => `/api/user/delete-user/${id}`,

        // Shipments
        getShipments: '/api/auth/all-shipments',

        // Refunds / purchases
        getRefunds: '/api/user/purchases',
        processRefund: '/api/user/process-refund',

        // Coupons
        getCoupons: '/api/user/get-coupon',
        createCoupon: '/api/user/coupons',
        updateCoupon: (id) => `/api/user/update-coupon/${id}`,
        deleteCoupon: (id) => `/api/user/delete-coupon/${id}`,

        // Feedback
        getFeedback: '/api/user/feedback',

        // Counselling
        getCounsellings: '/api/user/counselling',
        deleteCounselling: (id) => `/api/user/counselling/${id}`,

        // Bookings
        getBookings: '/api/bookings/get-booking',
        deleteBooking: (id) => `/api/bookings/delete-booking/${id}`,

        // Bulk order
        getBulkOrder: '/api/bulk/get-bulk-order',
        updateBulkOrder: '/api/bulk/update-bulk-order',

        // Admin management
        getAllAdmins: '/api/auth/admin/all-admins',
        createAdmin: '/api/auth/admin/create-admin',
        deleteAdmin: (id) => `/api/auth/admin/delete-admin/${id}`,
        updateAdminPassword: '/api/auth/admin/update-password',
      };
  }
}

/**
 * Build a full absolute image URL from any path stored in DB.
 *   "uploads/productImages/foo.jpg"  → "http://localhost:5555/uploads/productImages/foo.jpg"
 *   "/uploads/productImages/foo.jpg" → "http://localhost:5555/uploads/productImages/foo.jpg"
 *   "https://cdn.example.com/x.jpg"  → unchanged
 *   null / ""                        → null
 */
export function imageUrl(filePath) {
  if (!filePath || typeof filePath !== 'string' || !filePath.trim()) return null;
  const p = filePath.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = (import.meta.env.VITE_BASE_URL || 'http://localhost:5555').replace(/\/$/, '');
  const clean = p.startsWith('/') ? p : `/${p}`;
  return `${base}${clean}`;
}
