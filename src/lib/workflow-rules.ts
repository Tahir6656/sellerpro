export function isWithdrawalAmountAllowed(amount: number, minimum: number, balance: number) {
  return Number.isFinite(amount) && amount >= minimum && amount <= balance;
}

export function isPaymentAdminAction(action: string) {
  return action === "approve" || action === "reject";
}

export function isWithdrawalAdminAction(action: string, currentStatus: string) {
  if (action === "approve" || action === "reject") return currentStatus === "PENDING";
  return action === "complete" && currentStatus === "APPROVED";
}
