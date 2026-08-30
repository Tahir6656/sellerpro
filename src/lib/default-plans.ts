import prisma from "./db";

export const DEFAULT_PLANS = [
  { name: "Basic Plan", slug: "basic", products: 10, durationDays: 3, investment: 300, statedReturn: 500, sortOrder: 1 },
  { name: "Standard Plan", slug: "standard", products: 15, durationDays: 4, investment: 400, statedReturn: 700, sortOrder: 2 },
  { name: "Premium Plan", slug: "premium", products: 25, durationDays: 5, investment: 500, statedReturn: 900, sortOrder: 3 },
  { name: "Professional Plan", slug: "professional", products: 30, durationDays: 6, investment: 1000, statedReturn: 1700, sortOrder: 4 },
  { name: "Business Plan", slug: "business", products: 35, durationDays: 7, investment: 2000, statedReturn: 3000, sortOrder: 5 },
  { name: "Enterprise Plan", slug: "enterprise", products: 37, durationDays: 8, investment: 3000, statedReturn: 4500, sortOrder: 6 },
  { name: "Pro-Enterprise Plan", slug: "pro-enterprise", products: 40, durationDays: 13, investment: 5000, statedReturn: 7500, sortOrder: 7 },
  { name: "Elite Plan", slug: "elite", products: 50, durationDays: 15, investment: 7000, statedReturn: 10000, sortOrder: 8 },
] as const;

export async function ensureDefaultPlansExist() {
  let created = 0;

  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });

    if (!existing) {
      await prisma.plan.create({
        data: {
          ...plan,
          isActive: true,
          isVisible: true,
        },
      });
      created += 1;
      continue;
    }

    if (!existing.isActive || !existing.isVisible) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          isVisible: true,
        },
      });
    }
  }

  return { created };
}
