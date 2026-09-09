const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await prisma.vendorProduct.findMany({
      where: { isActive: true },
    });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

exports.getVendorProducts = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const products = await prisma.vendorProduct.findMany({
      where: { vendorId },
    });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { vendorId, name, brand, category, description, ingredients, nutritionFacts, weight, flavours, mrp, price, ownerPrice, memberPrice, margin, stock, lowStockThreshold, expiryDate, tags, offer } = req.body;

    if (!vendorId || !name || !brand || !memberPrice) {
      return res.status(400).json({ success: false, error: 'VendorId, Name, Brand and Member Price are required.' });
    }

    const calculatedMrp = parseFloat(mrp) || parseFloat(memberPrice);
    const calculatedMemberPrice = parseFloat(memberPrice);
    const calculatedOwnerPrice = parseFloat(ownerPrice) || calculatedMemberPrice;

    // Calculate discounts based on MRP
    const memberDisc = calculatedMrp > calculatedMemberPrice
      ? Math.round(((calculatedMrp - calculatedMemberPrice) / calculatedMrp) * 100)
      : 0;

    const ownerDisc = calculatedMrp > calculatedOwnerPrice
      ? Math.round(((calculatedMrp - calculatedOwnerPrice) / calculatedMrp) * 100)
      : 0;

    const product = await prisma.vendorProduct.create({
      data: {
        vendorId,
        name,
        brand,
        category: category || 'protein',
        description: description || '',
        ingredients: ingredients || '',
        nutritionFacts: nutritionFacts || '',
        weight: weight || 'N/A',
        flavours: flavours || [],
        images: [req.body.emoji || '📦'],
        mrp: calculatedMrp,
        price: calculatedMemberPrice,
        memberPrice: calculatedMemberPrice,
        ownerPrice: calculatedOwnerPrice,
        margin: parseFloat(margin) || 0,
        discount: memberDisc,
        ownerDiscount: ownerDisc,
        stock: parseInt(stock) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 5,
        expiryDate: expiryDate || 'N/A',
        tags: tags || [],
        offer: offer || (memberDisc > 0 ? `${memberDisc}% OFF` : ''),
      },
    });

    res.status(201).json({ success: true, message: 'Product added successfully!', product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, brand, category, description, ingredients, nutritionFacts, weight, flavours, mrp, price, ownerPrice, memberPrice, margin, stock, lowStockThreshold, expiryDate, tags, offer, emoji } = req.body;

    const calculatedMrp = mrp !== undefined ? parseFloat(mrp) : undefined;
    const calculatedMemberPrice = memberPrice !== undefined ? parseFloat(memberPrice) : undefined;
    const calculatedOwnerPrice = ownerPrice !== undefined ? parseFloat(ownerPrice) : undefined;

    // Fetch existing product to calculate changes if mrp or prices are edited
    const existing = await prisma.vendorProduct.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const finalMrp = calculatedMrp !== undefined ? calculatedMrp : existing.mrp;
    const finalMemberPrice = calculatedMemberPrice !== undefined ? calculatedMemberPrice : existing.memberPrice;
    const finalOwnerPrice = calculatedOwnerPrice !== undefined ? calculatedOwnerPrice : existing.ownerPrice;

    const memberDisc = finalMrp > finalMemberPrice
      ? Math.round(((finalMrp - finalMemberPrice) / finalMrp) * 100)
      : 0;

    const ownerDisc = finalMrp > finalOwnerPrice
      ? Math.round(((finalMrp - finalOwnerPrice) / finalMrp) * 100)
      : 0;

    const product = await prisma.vendorProduct.update({
      where: { id },
      data: {
        name,
        brand,
        category,
        description,
        ingredients,
        nutritionFacts,
        weight,
        flavours,
        images: emoji ? [emoji] : undefined,
        mrp: calculatedMrp,
        price: calculatedMemberPrice,
        memberPrice: calculatedMemberPrice,
        ownerPrice: calculatedOwnerPrice,
        margin: margin !== undefined ? parseFloat(margin) : undefined,
        discount: memberDisc,
        ownerDiscount: ownerDisc,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
        expiryDate,
        tags,
        offer: offer !== undefined ? offer : (memberDisc > 0 ? `${memberDisc}% OFF` : ''),
      },
    });

    res.json({ success: true, message: 'Product updated successfully!', product });
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vendorProduct.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const product = await prisma.vendorProduct.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json({ success: true, message: `Product status set to ${product.isActive ? 'active' : 'inactive'}`, product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.vendorProduct.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
