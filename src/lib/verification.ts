import type { Verification } from "@/data/catalog-types";

export const VERIFICATION_LABEL: Record<Verification["status"], string> = {
  verified: "Verified",
  partial: "Partially verified",
  "login-required": "Login required",
  "custom-pricing": "Custom pricing",
  unavailable: "Unavailable",
  discontinued: "Discontinued",
};

export const VERIFICATION_CLASS: Record<Verification["status"], string> = {
  verified: "text-[#7fe3a8]",
  partial: "text-[#f6c667]",
  "login-required": "text-[#f6c667]",
  "custom-pricing": "text-[#9db4d6]",
  unavailable: "text-[#ff8aa0]",
  discontinued: "text-[#ff8aa0]",
};
