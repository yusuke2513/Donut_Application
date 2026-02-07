// calculate/orderLogic.js

export const calculateFinalTotal = (orders) => {
  // 合計金額
  const total = orders.reduce((sum, order) => {
    return sum + order.price;
  }, 0);

  // セット割引（例：3個以上で100円引き）
  const discount = orders.length >= 3 ? 100 : 0;

  return total - discount;
};
