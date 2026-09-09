const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStore = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const store = await prisma.vendorStore.findUnique({ where: { userId } });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Vendor store not found.' });
    }
    res.json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { storeName, tagline, description, address, city, state, pincode, upiId, bankAccount, ifsc, freeDeliveryAbove, deliveryCharges, shopImage } = req.body;

    const store = await prisma.vendorStore.update({
      where: { id },
      data: {
        storeName,
        tagline,
        description,
        address,
        city,
        state,
        pincode,
        upiId,
        bankAccount,
        ifsc,
        freeDeliveryAbove: freeDeliveryAbove !== undefined ? parseFloat(freeDeliveryAbove) : undefined,
        deliveryCharges: deliveryCharges !== undefined ? parseFloat(deliveryCharges) : undefined,
        shopImage,
      },
    });

    res.json({ success: true, message: 'Store updated successfully!', store });
  } catch (err) {
    next(err);
  }
};

exports.uploadKyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, number } = req.body; // docType: 'aadhaar' | 'pan' etc.

    if (!type) {
      return res.status(400).json({ success: false, error: 'Document type is required.' });
    }

    const store = await prisma.vendorStore.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found.' });
    }

    // Parse existing docs
    let kycDocs = store.kycDocuments || [];
    if (typeof kycDocs === 'string') {
      kycDocs = JSON.parse(kycDocs);
    }

    // Check file path
    const filePath = req.file ? `/uploads/${req.file.filename}` : '';

    // Update specific document
    let docUpdated = false;
    kycDocs = kycDocs.map(doc => {
      if (doc.type === type) {
        docUpdated = true;
        return {
          ...doc,
          number: number || doc.number,
          status: 'pending',
          uploadedAt: new Date().toISOString().split('T')[0],
          fileUrl: filePath || doc.fileUrl,
        };
      }
      return doc;
    });

    if (!docUpdated) {
      kycDocs.push({
        type,
        label: type.replace('_', ' ').toUpperCase(),
        number: number || '',
        status: 'pending',
        uploadedAt: new Date().toISOString().split('T')[0],
        fileUrl: filePath,
      });
    }

    const updatedStore = await prisma.vendorStore.update({
      where: { id },
      data: { kycDocuments: kycDocs },
    });

    res.json({
      success: true,
      message: 'KYC Document uploaded for verification!',
      store: updatedStore,
    });
  } catch (err) {
    next(err);
  }
};

exports.simulateApprove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.vendorStore.update({
      where: { id },
      data: { status: 'approved' },
    });
    res.json({ success: true, message: 'Store approved!', store });
  } catch (err) {
    next(err);
  }
};
