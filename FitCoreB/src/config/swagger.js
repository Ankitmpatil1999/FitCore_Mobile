const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'FitCore Backend API 🏋️',
      version: '2.0.0',
      description: `
## FitCore Gym Management API

**Security Model:**
- Public endpoints: \`/api/auth/*\`, \`/api/exercises\`, \`/api/products\`
- Protected endpoints: Require \`Authorization: Bearer <token>\` header
- Role-based access: \`super_admin\` → Admin panel | \`admin\` / \`gym_owner\` → Gym Admin | \`member\` → Member APIs

**To test protected routes:**
1. Call \`POST /api/auth/web-login\` (or \`/api/auth/login\` for mobile)
2. Copy the \`token\` from the response
3. Click the **Authorize** 🔒 button above and paste: \`Bearer <your_token>\`
4. All authenticated routes will now work
      `,
      contact: {
        name: 'FitCore Support',
        email: 'support@fitcore.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:7000',
        description: 'Local development server',
      },
    ],
    // ── SECURITY SCHEME ──────────────────────────────────
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (without "Bearer " prefix)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60c72b2f9b1d8e2348a56f11' },
            name: { type: 'string', example: 'Arjun Mehta' },
            phone: { type: 'string', example: '9209282289' },
            email: { type: 'string', example: 'arjun@gmail.com' },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'gym_owner', 'member', 'vendor'],
              example: 'member',
            },
            avatar: { type: 'string', example: 'AM' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: {
              type: 'string',
              description: 'JWT Bearer token — use this in Authorization header',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: { '$ref': '#/components/schemas/User' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Invalid Mobile Number or Password.' },
          },
        },
        VendorStore: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60c72b2f9b1d8e2348a56f12' },
            userId: { type: 'string', example: '60c72b2f9b1d8e2348a56f11' },
            storeName: { type: 'string', example: 'MuscleZone Nutrition' },
            ownerName: { type: 'string', example: 'Karan Shetty' },
            category: { type: 'string', example: 'supplement_store' },
            phone: { type: 'string', example: '9326093115' },
            email: { type: 'string', example: 'karan@musclestore.in' },
            address: { type: 'string', example: 'MG Road, Pune' },
            city: { type: 'string', example: 'Pune' },
            state: { type: 'string', example: 'Maharashtra' },
            pincode: { type: 'string', example: '411001' },
            status: { type: 'string', example: 'approved' },
            shopImage: { type: 'string', example: '🏪' },
            rating: { type: 'number', example: 4.7 },
            deliveryCharges: { type: 'number', example: 49 },
            freeDeliveryAbove: { type: 'number', example: 999 },
          },
        },
        VendorProduct: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60c72b2f9b1d8e2348a56f13' },
            vendorId: { type: 'string', example: '60c72b2f9b1d8e2348a56f12' },
            name: { type: 'string', example: 'Whey Protein Gold Standard' },
            brand: { type: 'string', example: 'Optimum Nutrition' },
            category: { type: 'string', example: 'protein' },
            weight: { type: 'string', example: '2 kg' },
            mrp: { type: 'number', example: 4999 },
            price: { type: 'number', example: 3999 },
            ownerPrice: { type: 'number', example: 3499 },
            memberPrice: { type: 'number', example: 3999 },
            margin: { type: 'number', example: 18 },
            discount: { type: 'number', example: 20 },
            stock: { type: 'integer', example: 24 },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
    // Apply BearerAuth globally to all operations by default
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsDoc(swaggerOptions);
