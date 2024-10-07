export const getCurrencyIcon = (currency) => {
  if (currency === "USD") {
    return "$";
  }
  if (currency === "INR") {
    return "₹";
  }
  if (currency === "EUR") {
    return "€";
  }
  if (currency === "AUD") {
    return "A$";
  }
  return "$";
};
