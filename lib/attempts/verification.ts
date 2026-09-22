/**
 * Email verification is still being rolled out. Keep the exam gate opt-in so
 * legacy students are not locked out of practice while that flow is verified.
 */
export function examEmailVerificationGateEnabled() {
  return process.env.EXAM_EMAIL_VERIFICATION_GATE_ENABLED === 'true';
}

