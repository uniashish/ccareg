/**
 * Resolves the initial Firestore role for a new user based on their email.
 * Centralised here so AuthContext and userService stay in sync automatically.
 *
 * Rules:
 *  - Email starting with two digits  → "student"  (e.g. 30athaarva@sis-kg.org)
 *  - Everything else                 → "teacher"
 */
export function resolveRoleFromEmail(email) {
  if (!email) return "teacher";
  return /^\d{2}/.test(email) ? "student" : "teacher";
}
