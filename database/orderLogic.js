// calculate/orderLogic.js
/*
export const calculateFinalTotal = (orders) => {
  const donutCount = orders.filter(o => o.product_type === 'donut').length;
  const drinkCount = orders.filter(o => o.product_type === 'drink').length;

  let total = orders.reduce((sum, item) => {
    const toppingTotal = item.toppings?.reduce((tSum, t) => tSum + t.price, 0) || 0;
    return sum + item.price + toppingTotal;
  }, 0);

  let discount = 0;
  let remainingDonuts = donutCount;
  let remainingDrinks = drinkCount;

  // 1. 優先：ドーナツ2 + ドリンク1 のセット (70円引き)
  while (remainingDonuts >= 2 && remainingDrinks >= 1) {
    discount += 70;
    remainingDonuts -= 2;
    remainingDrinks -= 1;
  }

  // 2. 残り：ドーナツ1 + ドリンク1 のセット (30円引き)
  while (remainingDonuts >= 1 && remainingDrinks >= 1) {
    discount += 30;
    remainingDonuts -= 1;
    remainingDrinks -= 1;
  }

  return {
    total,
    discount,
    finalTotal: total - discount,
    // セット数は合計で表示
    setCount: Math.floor((donutCount + drinkCount) / 2) 
  };
};

*/

// database/orderLogic.js

export const calculateFinalTotal = (orders) => {
  // 1. 小計の計算（(商品単価 + トッピング単価合計) × 数量）
  const total = orders.reduce((sum, item) => {
    const toppingSum = item.toppings?.reduce((tSum, t) => tSum + t.price, 0) || 0;
    const itemTotal = (item.price + toppingSum) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // 2. セット割引の判定（個数ベースで集計）
  const donutsCount = orders
    .filter((i) => i.product_type === "donut")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  const drinksCount = orders
    .filter((i) => i.product_type === "drink")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  // ドーナツとドリンクのペア数
  const setCount = Math.min(donutsCount, drinksCount);
  const discount = setCount * 100; // 1セットにつき100円引き
  const finalTotal = total - discount;

  return { total, discount, finalTotal, setCount };
};