/**
 * Normalize verification status to boolean
 */
export const normalizeVerified = (value) => {
  if (value === true) return true;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "yes" || normalized === "verified";
};

/**
 * Escape CSV values to handle special characters
 */
export const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

/**
 * Escape HTML to prevent XSS
 */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Normalize text for comparison
 */
export const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

/**
 * Maximum number of CCAs a student can select
 */
export const MAX_CCAS = 3;

/**
 * Export field definitions
 */
export const EXPORT_FIELDS = [
  { key: "studentName", label: "Student Name" },
  { key: "className", label: "Class" },
  ...Array.from({ length: MAX_CCAS }, (_, i) => ({
    key: `cca${i + 1}`,
    label: `CCA${i + 1}`,
  })),
  { key: "attendance", label: "Attendance" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "verified", label: "Verified" },
];
