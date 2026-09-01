export const MINIMUM_PASSWORD_CHARACTERS = 12;
export const MAXIMUM_PASSWORD_BYTES = 72;

export interface PasswordPolicyResult {
  isValid: boolean;
  hasMinimumLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  withinByteLimit: boolean;
}

export function evaluatePasswordPolicy(
  password: string,
): PasswordPolicyResult {
  const hasMinimumLength =
    [...password].length >= MINIMUM_PASSWORD_CHARACTERS;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const withinByteLimit =
    new TextEncoder().encode(password).length <= MAXIMUM_PASSWORD_BYTES;

  return {
    isValid:
      hasMinimumLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      withinByteLimit,
    hasMinimumLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    withinByteLimit,
  };
}

export const PASSWORD_REQUIREMENTS_TEXT =
  "Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.";
