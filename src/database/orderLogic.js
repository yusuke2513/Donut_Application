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

// database/orderLogic.js

export const calculateFinalTotal = (orders) => {
  if (!orders || orders.length === 0) {
    return { total: 0, discount: 0, finalTotal: 0, numTrios: 0, numCombos: 0 };
  }

  // 1. 小計の計算（(単価 + トッピング単価合計) × 数量）
  const total = orders.reduce((sum, item) => {
    const toppingSum = item.toppings?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0;
    const itemTotal = (item.price + toppingSum) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // 2. 個数の集計
  let donutsCount = orders
    .filter((i) => i.product_type === "donut")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  let drinksCount = orders
    .filter((i) => i.product_type === "drink")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  // 3. 値引きの計算ロジック
  // まずは「トリオ（ドーナツ2 + ドリンク1）」を優先してカウント
  const numTrios = Math.min(Math.floor(donutsCount / 2), drinksCount);
  const remainingDonuts = donutsCount - numTrios * 2;
  const remainingDrinks = drinksCount - numTrios;

  // 残ったドーナツとドリンクで「コンビ（ドーナツ1 + ドリンク1）」をカウント
  const numCombos = Math.min(remainingDonuts, remainingDrinks);

  const discount = (numTrios * 70) + (numCombos * 30);
  const finalTotal = total - discount;

  return { total, discount, finalTotal, numTrios, numCombos };
};