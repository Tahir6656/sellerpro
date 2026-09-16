import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, withdrawalSchema } from "../src/lib/validators";
import {
  isPaymentAdminAction,
  isWithdrawalAdminAction,
  isWithdrawalAmountAllowed,
} from "../src/lib/workflow-rules";

test("login workflow accepts valid mobile credentials", () => {
  assert.equal(loginSchema.safeParse({ mobile: "03001234567", password: "secret" }).success, true);
  assert.equal(loginSchema.safeParse({ mobile: "03001234567", password: "" }).success, false);
});

test("payment workflow only allows approve or reject admin actions", () => {
  assert.equal(isPaymentAdminAction("approve"), true);
  assert.equal(isPaymentAdminAction("reject"), true);
  assert.equal(isPaymentAdminAction("complete"), false);
});

test("withdrawal workflow enforces minimum and available balance", () => {
  assert.equal(withdrawalSchema.safeParse({ methodId: "cash", accountNumber: "03001234567", accountHolder: "A User", amount: 300 }).success, true);
  assert.equal(isWithdrawalAmountAllowed(299, 300, 1000), false);
  assert.equal(isWithdrawalAmountAllowed(300, 300, 1000), true);
  assert.equal(isWithdrawalAmountAllowed(1001, 300, 1000), false);
});

test("admin withdrawal approvals follow the status flow", () => {
  assert.equal(isWithdrawalAdminAction("approve", "PENDING"), true);
  assert.equal(isWithdrawalAdminAction("complete", "APPROVED"), true);
  assert.equal(isWithdrawalAdminAction("complete", "PENDING"), false);
  assert.equal(isWithdrawalAdminAction("approve", "COMPLETED"), false);
});
