import prisma from "./db";

const DEFAULTS: Record<string, string> = {
  welcome_title: "Welcome to SellerPro",
  welcome_subtitle:
    "Your professional platform for managed selling plans and transparent account management.",
  welcome_hero:
    "Join SellerPro to access structured selling plans, secure payments, and referral rewards — all managed through a professional dashboard.",
  dashboard_description:
    "Manage your plans, track your balance, request withdrawals, and grow your network through referrals.",
  how_it_works_text:
    "1. Choose a plan that fits your goals.\n2. Submit payment proof for admin verification.\n3. Once approved, your plan activates and you can track progress.\n4. Earn referral rewards when eligible referrals activate plans.\n5. Request withdrawals through supported methods.",
  how_it_works_audio: "",
  how_it_works_video: "",
  maintenance_enabled: "false",
  maintenance_message:
    "We are performing scheduled maintenance. Please check back shortly.",
  maintenance_end: "",
  announcement: "",
  referral_reward_amount: process.env.REFERRAL_REWARD_AMOUNT || "50",
  min_withdrawal: "300",
  max_withdrawal: "100000",
};

export async function getConfig(key: string): Promise<string> {
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config?.value ?? DEFAULTS[key] ?? "";
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const configs = await prisma.systemConfig.findMany();
  const result = { ...DEFAULTS };
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}

export async function setConfig(
  key: string,
  value: string,
  updatedBy?: string
) {
  return prisma.systemConfig.upsert({
    where: { key },
    update: { value, updatedBy },
    create: { key, value, updatedBy },
  });
}

export async function isMaintenanceMode(): Promise<{
  enabled: boolean;
  message: string;
  endTime: string | null;
}> {
  const enabled = (await getConfig("maintenance_enabled")) === "true";
  const message = await getConfig("maintenance_message");
  const endTime = await getConfig("maintenance_end");
  return { enabled, message, endTime: endTime || null };
}

export async function setMultipleConfig(
  entries: Record<string, string>,
  updatedBy?: string
) {
  for (const [key, value] of Object.entries(entries)) {
    await setConfig(key, value, updatedBy);
  }
}
