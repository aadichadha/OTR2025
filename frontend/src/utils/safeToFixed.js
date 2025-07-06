// Safely format a value to fixed decimals, returns '0.0' if not a number
export default function safeToFixed(value, decimals = 1) {
  const num = parseFloat(value);
  return isNaN(num) ? '0.0' : num.toFixed(decimals);
} 