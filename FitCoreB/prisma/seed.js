const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const hashedPassword = bcrypt.hashSync('Hello@123', 10);
  console.log('🧹 Cleaning database collections...');
  try {
    await prisma.user.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.gym.deleteMany({});
    await prisma.vendorStore.deleteMany({});
    await prisma.vendorProduct.deleteMany({});
    await prisma.vendorOrder.deleteMany({});
    console.log('🧹 Database cleaned successfully.');
  } catch (err) {
    console.log('⚠️ Note: Skipping database cleaning or handled locally.');
  }

  console.log('👤 Seeding Super Admin user...');
  try {
    await prisma.user.create({
      data: {
        name: 'FitCore Super Admin',
        phone: '8530292487',
        email: 'fitcore@gmail.com',
        password: hashedPassword,
        role: 'admin',
        avatar: 'AD',
      }
    });
    console.log('👤 Super Admin successfully seeded.');
  } catch (err) {
    console.log('⚠️ Failed to seed Super Admin:', err.message);
  }

  console.log('🌱 Seeding database with Nagpur Gym Franchises, Owners, and Members...');

  const gymDataList = [
    {
      name: 'Fns fitness club',
      address: '2nd floor, Guatam Traders, Besa Rd, Ramchandra Nagar, Manewada',
      city: 'Nagpur',
      phone: '9999999999',
      email: 'fnsfitness@gmail.com',
      ownerName: 'Rahul Barapatre',
      ownerPhone: '9999999999',
      ownerEmail: 'rahul@fnsfitness.com',
      status: 'approved',
    },
    {
      name: 'Arena Gym & Health Club',
      address: 'Manewada Rd, Manewada Chowk, Ulhas Nagar, Manewada',
      city: 'Nagpur',
      phone: '9999999998',
      email: 'arenagym@gmail.com',
      ownerName: 'Ayush Singh',
      ownerPhone: '9999999998',
      ownerEmail: 'ayush@arenagym.com',
      status: 'approved',
    },
    {
      name: 'DESIRE FITNESS CLUB',
      address: '11, Chandra Nagar Rd, Hawarapeth, Chandranagar, Bhagwan Nagar',
      city: 'Nagpur',
      phone: '9999999997',
      email: 'desirefitness@gmail.com',
      ownerName: 'Ankit patil',
      ownerPhone: '9999999997',
      ownerEmail: 'ankit@desirefitness.com',
      status: 'pending',
    },
    {
      name: 'Suraj wanjari personal trainer and Unisex Gym',
      address: 'Plot No: 362, Floor No: 3, Wanjari Complex Doctor Ambedkar Road Kamal chowk, Guru Nanak Pura, shanichar market',
      city: 'Nagpur',
      phone: '9999999996',
      email: 'surajwanjari@gmail.com',
      ownerName: 'Karan Gawande',
      ownerPhone: '9999999996',
      ownerEmail: 'karan@surajwanjari.com',
      status: 'suspended',
    }
  ];

  let memberPhoneCounter = 9000000000;
  let seededGyms = [];
  let firstSeededMember = null;

  for (const gymInfo of gymDataList) {
    // 1. Create Gym
    const gym = await prisma.gym.create({
      data: {
        name: gymInfo.name,
        address: gymInfo.address,
        city: gymInfo.city,
        phone: gymInfo.phone,
        email: gymInfo.email,
        rating: 4.8,
        status: gymInfo.status,
      }
    });
    console.log(`🏢 Created Gym: ${gym.name} in ${gym.city}`);
    seededGyms.push(gym);

    // 2. Create Owner User
    const ownerUser = await prisma.user.create({
      data: {
        name: gymInfo.ownerName,
        phone: gymInfo.ownerPhone,
        email: gymInfo.ownerEmail,
        password: hashedPassword,
        role: 'gym_owner',
        gymId: gym.id,
        avatar: gymInfo.ownerName.split(' ').map(n => n[0]).join('').toUpperCase(),
      }
    });
    console.log(`👤 Created Owner User: ${ownerUser.name} (${ownerUser.email})`);

    // 3. Create 100 members
    console.log(`⚡ Seeding 100 member profiles for ${gym.name}...`);
    const shortGymName = gymInfo.name.split(' ')[0];
    
    for (let i = 1; i <= 100; i++) {
      const memberName = `${shortGymName} Member ${i}`;
      const memberPhone = String(memberPhoneCounter++);
      const memberEmail = `${shortGymName.toLowerCase()}_member${i}@fitcore.com`;

      const user = await prisma.user.create({
        data: {
          name: memberName,
          phone: memberPhone,
          email: memberEmail,
          password: hashedPassword,
          role: 'member',
          gymId: gym.id,
          avatar: memberName.split(' ').map(n => n[0]).join('').toUpperCase(),
        }
      });

      const member = await prisma.member.create({
        data: {
          userId: user.id,
          name: memberName,
          phone: memberPhone,
          email: memberEmail,
          gymId: gym.id,
          gender: i % 2 === 0 ? 'male' : 'female',
          dob: '1998-05-15',
          height: 175,
          weight: 70,
          bmi: 22.8,
          goal: 'fitness',
          status: 'active',
          joinDate: '2026-01-10',
          expiryDate: '2027-01-10',
        }
      });

      if (!firstSeededMember) {
        firstSeededMember = member;
      }
    }
    console.log(`✅ 100 members successfully seeded for ${gym.name}.`);
  }

  // 4. Create Vendor Store Partner
  console.log('🏪 Seeding central Vendor partner store...');
  let store;
  try {
    const vendorUser = await prisma.user.create({
      data: {
        name: 'Karan Shetty',
        phone: '9326093115',
        email: 'karan@musclestore.in',
        password: hashedPassword,
        role: 'vendor',
        avatar: 'KS',
      }
    });

    store = await prisma.vendorStore.create({
      data: {
        userId: vendorUser.id,
        storeName: 'MuscleZone Nutrition',
        ownerName: 'Karan Shetty',
        category: 'supplement_store',
        gstNumber: '27AABCS1429B1Z0',
        phone: '9326093115',
        email: 'karan@musclestore.in',
        address: 'Shop 12, Fitness Hub, MG Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        upiId: 'karan.shetty@paytm',
        bankAccount: 'XXXXXXXXXX4521',
        ifsc: 'HDFC0001234',
        status: 'approved',
        avatar: 'MZ',
        shopImage: '💊',
        rating: 4.7,
        totalReviews: 234,
        joinDate: '2026-01-10',
        tagline: 'Premium Supplements at Gym Prices',
        description: 'Authorized distributor of MuscleBlaze, Optimum Nutrition & GNC.',
        deliveryMethods: ['self', 'local'],
        freeDeliveryAbove: 999,
        deliveryCharges: 49,
        kycDocuments: [
          { type: 'aadhaar', label: 'Aadhaar Card', number: '1234 5678 9012', status: 'verified', uploadedAt: '2026-01-05' },
          { type: 'pan', label: 'PAN Card', number: 'ABCPS1234D', status: 'verified', uploadedAt: '2026-01-05' },
          { type: 'electricity_bill', label: 'Electricity Bill', number: '', status: 'pending', uploadedAt: '2026-01-08' },
          { type: 'shop_license', label: 'Shop License', number: 'MH/SHOP/2024/1234', status: 'pending', uploadedAt: '2026-01-08' },
        ],
      }
    });
    console.log(`🏪 Created Store: ${store.storeName}`);
  } catch (err) {
    console.log('❌ Failed to create Vendor User or Store:', err.message);
  }

  // 5. Seed Vendor Products
  let product1, product2;
  if (store) {
    try {
      product1 = await prisma.vendorProduct.create({
        data: {
          vendorId: store.id,
          name: 'Whey Protein Gold Standard',
          brand: 'Optimum Nutrition',
          category: 'protein',
          description: '100% Whey Protein with 24g protein per serving.',
          weight: '2 kg',
          flavours: ['Double Rich Chocolate', 'Vanilla Ice Cream'],
          images: ['💪'],
          mrp: 4999,
          price: 3999,
          ownerPrice: 3499,
          memberPrice: 3999,
          margin: 18,
          discount: 20,
          ownerDiscount: 30,
          stock: 24,
          isActive: true,
          tags: ['bestseller', 'protein'],
          offer: '20% OFF',
        },
      });

      product2 = await prisma.vendorProduct.create({
        data: {
          vendorId: store.id,
          name: 'Creatine Monohydrate 300g',
          brand: 'Optimum Nutrition',
          category: 'creatine',
          description: 'Micronized creatine monohydrate for strength gains.',
          weight: '300 g',
          flavours: ['Unflavoured'],
          images: ['⚗️'],
          mrp: 1299,
          price: 999,
          ownerPrice: 849,
          memberPrice: 999,
          margin: 22,
          discount: 23,
          ownerDiscount: 35,
          stock: 15,
          isActive: true,
          tags: ['creatine', 'strength'],
          offer: '23% OFF',
        },
      });
      console.log('📦 Created Vendor Products');
    } catch (err) {
      console.log('❌ Failed to create Vendor Products:', err.message);
    }
  }

  // 6. Seed Vendor Orders
  if (store && firstSeededMember && product1) {
    try {
      await prisma.vendorOrder.create({
        data: {
          vendorId: store.id,
          buyerId: firstSeededMember.userId,
          buyerName: firstSeededMember.name,
          buyerPhone: firstSeededMember.phone,
          buyerType: 'member',
          items: [
            { productId: product1.id, productName: product1.name, qty: 1, price: 3999, total: 3999 },
          ],
          total: 3999,
          deliveryCharge: 0,
          discount: 0,
          status: 'delivered',
          deliveryMethod: 'local',
          deliveryAddress: 'Manewada Nagpur',
          paymentMethod: 'upi',
          orderedAt: '2026-06-10',
          updatedAt: '2026-06-12',
        },
      });
      console.log('🧾 Created Vendor Orders');
    } catch (err) {
      console.log('❌ Failed to create Vendor Orders:', err.message);
    }
  }

  console.log('✨ All Seeding Tasks Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
