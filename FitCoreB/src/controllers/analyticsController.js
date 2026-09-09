const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getVendorAnalytics = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    // Fetch all store orders and products
    const orders = await prisma.vendorOrder.findMany({ where: { vendorId } });
    const products = await prisma.vendorProduct.findMany({ where: { vendorId } });

    const todayStr = new Date().toISOString().split('T')[0];

    // Basic KPIs
    const todayOrders = orders.filter(o => o.orderedAt === todayStr);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const monthlyRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold).length;

    // Buyer type split
    const ownerOrders = orders.filter(o => o.buyerType === 'gym_owner' && o.status !== 'cancelled');
    const memberOrders = orders.filter(o => o.buyerType === 'member' && o.status !== 'cancelled');

    const ownerOrderCount = ownerOrders.length;
    const memberOrderCount = memberOrders.length;

    const ownerRevenue = ownerOrders.reduce((sum, o) => sum + o.total, 0);
    const memberRevenue = memberOrders.reduce((sum, o) => sum + o.total, 0);

    // Compute monthly chart trends
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const activeMonths = months.slice(0, currentMonthIdx + 1);

    const revenueChart = activeMonths.map(m => ({ label: m, value: 0 }));
    const ownerRevenueChart = activeMonths.map(m => ({ label: m, value: 0 }));
    const memberRevenueChart = activeMonths.map(m => ({ label: m, value: 0 }));

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const orderDate = new Date(o.orderedAt);
      const monthIdx = orderDate.getMonth();
      if (monthIdx <= currentMonthIdx) {
        revenueChart[monthIdx].value += o.total;
        if (o.buyerType === 'gym_owner') {
          ownerRevenueChart[monthIdx].value += o.total;
        } else {
          memberRevenueChart[monthIdx].value += o.total;
        }
      }
    });

    // Orders status count
    const ordersByStatus = {
      new: orders.filter(o => o.status === 'new').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      packed: orders.filter(o => o.status === 'packed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Find top selling product
    let topProduct = 'N/A';
    if (products.length > 0) {
      const sortedBySold = [...products].sort((a, b) => b.sold - a.sold);
      topProduct = sortedBySold[0].name;
    }

    res.json({
      success: true,
      analytics: {
        todayOrders: todayOrders.length,
        todayRevenue,
        monthlyRevenue,
        pendingOrders,
        deliveredOrders,
        totalProducts,
        lowStockProducts,
        avgRating: 4.7, // Simulated
        totalReviews: 234, // Simulated
        returnsThisMonth: 1, // Simulated
        topProduct,
        ownerOrderCount,
        memberOrderCount,
        ownerRevenue,
        memberRevenue,
        revenueChart,
        ownerRevenueChart,
        memberRevenueChart,
        ordersByStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};
