import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "../src/lib/auth";

const prisma = new PrismaClient();

const PLANS = [
  { name: "Basic Plan", slug: "basic", products: 10, durationDays: 3, investment: 300, statedReturn: 500, sortOrder: 1, isActive: true, isVisible: true },
  { name: "Standard Plan", slug: "standard", products: 15, durationDays: 4, investment: 400, statedReturn: 700, sortOrder: 2, isActive: true, isVisible: true },
  { name: "Premium Plan", slug: "premium", products: 25, durationDays: 5, investment: 500, statedReturn: 900, sortOrder: 3, isActive: true, isVisible: true },
  { name: "Professional Plan", slug: "professional", products: 30, durationDays: 6, investment: 1000, statedReturn: 1700, sortOrder: 4, isActive: true, isVisible: true },
  { name: "Business Plan", slug: "business", products: 35, durationDays: 7, investment: 2000, statedReturn: 3000, sortOrder: 5, isActive: true, isVisible: true },
  { name: "Enterprise Plan", slug: "enterprise", products: 37, durationDays: 8, investment: 3000, statedReturn: 4500, sortOrder: 6, isActive: true, isVisible: true },
  { name: "Pro-Enterprise Plan", slug: "pro-enterprise", products: 40, durationDays: 13, investment: 5000, statedReturn: 7500, sortOrder: 7, isActive: true, isVisible: true },
  { name: "Elite Plan", slug: "elite", products: 50, durationDays: 15, investment: 7000, statedReturn: 10000, sortOrder: 8, isActive: true, isVisible: true },
];

async function main() {
  console.log("Seeding SellerPro database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@sellerpro.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  const adminMobile = process.env.ADMIN_MOBILE || "03351999093";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const existingAdmin = await prisma.user.findFirst({
    where: { OR: [{ email: adminEmail }, { role: "ADMIN" }] },
  });

  if (!existingAdmin) {
    let code = generateReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode();
    }

    await prisma.user.create({
      data: {
        username: "admin",
        email: adminEmail,
        mobile: adminMobile,
        passwordHash,
        role: "ADMIN",
        referralCode: code,
      },
    });
    console.log("Admin user created:", adminMobile);
  } else {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        mobile: adminMobile,
        passwordHash,
        role: "ADMIN",
        accountStatus: "ACTIVE",
      },
    });
    console.log("Admin credentials updated:", adminMobile);
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log("Plans seeded:", PLANS.length);

  const paymentAccounts = [
    {
      methodName: "JazzCash",
      accountHolder: "SellerPro Official",
      accountNumber: "03001234567",
      mobileId: "03001234567",
      instructions: "Send payment to this JazzCash number and upload screenshot.",
    },
    {
      methodName: "EasyPaisa",
      accountHolder: "SellerPro Official",
      accountNumber: "03001234567",
      mobileId: "03001234567",
      instructions: "Send payment to this EasyPaisa number and upload screenshot.",
    },
    {
      methodName: "Bank Transfer",
      accountHolder: "SellerPro Pvt Ltd",
      accountNumber: "1234567890123456",
      instructions: "Transfer to HBL Account. Include your username in reference.",
    },
  ];

  for (const account of paymentAccounts) {
    const existing = await prisma.paymentAccount.findFirst({
      where: { methodName: account.methodName },
    });
    if (!existing) {
      await prisma.paymentAccount.create({ data: account });
    }
  }
  console.log("Payment accounts seeded");

  const withdrawalMethods = [
    { name: "EasyPaisa", minAmount: 300, maxAmount: 50000 },
    { name: "JazzCash", minAmount: 300, maxAmount: 50000 },
  ];

  for (const method of withdrawalMethods) {
    await prisma.withdrawalMethod.upsert({
      where: { name: method.name },
      update: method,
      create: method,
    });
  }
  console.log("Withdrawal methods seeded");

  const configs = {
    welcome_title: "Welcome to SellerPro",
    welcome_subtitle: "Your professional platform for managed selling plans and transparent account management.",
    welcome_hero: "Join SellerPro to access structured selling plans, secure payments, and referral rewards — all managed through a professional dashboard.",
    dashboard_description: "Manage your plans, track your balance, request withdrawals, and grow your network through referrals.",
    how_it_works_text: "1. Choose a plan that fits your goals.\n2. Submit payment proof for admin verification.\n3. Once approved, your plan activates and you can track progress.\n4. Earn referral rewards when eligible referrals activate plans.\n5. Request withdrawals through supported methods.",
    referral_reward_amount: process.env.REFERRAL_REWARD_AMOUNT || "50",
    min_withdrawal: "300",
    max_withdrawal: "100000",
  };

  for (const [key, value] of Object.entries(configs)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("System config seeded");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
