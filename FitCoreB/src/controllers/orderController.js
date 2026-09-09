const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrder = async (req, res, next) => {
  try {
    const { vendorId, buyerId, buyerName, buyerPhone, buyerType, items, deliveryMethod, deliveryAddress, paymentMethod, notes } = req.body;

    if (!vendorId || !buyerId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'VendorId, BuyerId and items list are required.' });
    }

    // Resolve prices and stock changes
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.vendorProduct.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ success: false, error: `Insufficient stock for product: ${product.name}` });
      }

      // Check price matching role
      const price = buyerType === 'gym_owner' ? product.ownerPrice : product.memberPrice;
      const itemTotal = price * item.qty;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        qty: item.qty,
        price,
        total: itemTotal,
      });

      // Deduct stock
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: {
          stock: product.stock - item.qty,
          sold: product.sold + item.qty,
        },
      });
    }

    // Retrieve Store settings to check shipping rules
    const store = await prisma.vendorStore.findUnique({ where: { id: vendorId } });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found.' });
    }

    let deliveryCharge = store.deliveryCharges || 0;
    if (store.freeDeliveryAbove > 0 && subtotal >= store.freeDeliveryAbove) {
      deliveryCharge = 0;
    }

    const total = subtotal + deliveryCharge;

    const order = await prisma.vendorOrder.create({
      data: {
        vendorId,
        buyerId,
        buyerName,
        buyerPhone,
        buyerType,
        items: orderItems,
        total,
        deliveryCharge,
        discount: 0, // Could support coupons here
        status: 'new',
        deliveryMethod: deliveryMethod || 'local',
        deliveryAddress: deliveryAddress || '',
        paymentMethod: paymentMethod || 'cash_on_delivery',
        orderedAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        notes: notes || '',
      },
    });

    res.status(201).json({ success: true, message: 'Order created successfully!', order });
  } catch (err) {
    next(err);
  }
};

exports.getVendorOrders = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const orders = await prisma.vendorOrder.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.vendorOrder.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingId } = req.body;

    const order = await prisma.vendorOrder.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Handle cancellation: return stock back
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      for (const item of items) {
        const product = await prisma.vendorProduct.findUnique({ where: { id: item.productId } });
        if (product) {
          await prisma.vendorProduct.update({
            where: { id: product.id },
            data: {
              stock: product.stock + item.qty,
              sold: Math.max(0, product.sold - item.qty),
            },
          });
        }
      }
    }

    const updated = await prisma.vendorOrder.update({
      where: { id },
      data: {
        status,
        trackingId: trackingId !== undefined ? trackingId : undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    });

    res.json({ success: true, message: `Order status set to ${status}`, order: updated });
  } catch (err) {
    next(err);
  }
};
