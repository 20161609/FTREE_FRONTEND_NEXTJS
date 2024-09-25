// src/libs/santizer.js

// Example 100000 -> 100,000
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}