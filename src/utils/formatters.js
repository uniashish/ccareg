// src/utils/formatters.js

export const formatTime12hr = (timeStr) => {
  if (!timeStr) return "TBD";
  try {
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const formatPriceIDR = (price) => {
  if (!price || price === "0" || price === 0) return "Free";
  const numericPrice =
    typeof price === "string" ? parseInt(price.replace(/\D/g, "")) : price;
  return (
    "Rp " +
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(
      numericPrice,
    )
  );
};

export const formatDaysShort = (days) => {
  if (!days || !Array.isArray(days)) return "TBD";
  return days.map((day) => day.substring(0, 3)).join(", ");
};
