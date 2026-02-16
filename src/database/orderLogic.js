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


/*
export const calculateFinalTotal = (orders) => {
  // 🌟 割引対象外(excludeFromDiscount: true)の商品を計算から外す
  const discountableItems = orders.filter((item) => !item.excludeFromDiscount);

  // 以下、orders ではなく discountableItems を使ってセット数をカウントする
  const numDonuts = discountableItems
    .filter((item) => item.product_type === "donut")
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  const numDrinks = discountableItems
    .filter((item) => item.product_type === "drink")
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (!orders || orders.length === 0) {
    return { total: 0, discount: 0, finalTotal: 0, numTrios: 0, numCombos: 0 };
  }

  // 1. 小計の計算（(単価 + トッピング単価合計) × 数量）
  const total = orders.reduce((sum, item) => {
    const toppingSum =
      item.toppings?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0;
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

  const discount = numTrios * 70 + numCombos * 30;
  const finalTotal = total - discount;

  return { total, discount, finalTotal, numTrios, numCombos };
};
*/

export const calculateFinalTotal = (orders) => {
  if (!orders || orders.length === 0) {
    return { total: 0, discount: 0, finalTotal: 0, numTrios: 0, numCombos: 0 };
  }

  // 1. 全体の小計を計算（これは milkyドーナツソフト も含める必要があります）
  const total = orders.reduce((sum, item) => {
    const toppingSum =
      item.toppings?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0;
    const itemTotal = (item.price + toppingSum) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // 2. 割引対象になる商品だけを抽出（excludeFromDiscount: true を除外）
  const discountableItems = orders.filter((item) => !item.excludeFromDiscount);

  // 3. 割引対象の商品だけで個数をカウントする
  const donutsCount = discountableItems
    .filter((i) => i.product_type === "donut")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  const drinksCount = discountableItems
    .filter((i) => i.product_type === "drink")
    .reduce((s, i) => s + (i.quantity || 1), 0);

  // 4. 値引きの計算ロジック（カウントした donutsCount / drinksCount を使用）
  // トリオ（ドーナツ2 + ドリンク1）を優先
  const numTrios = Math.min(Math.floor(donutsCount / 2), drinksCount);
  const remainingDonuts = donutsCount - numTrios * 2;
  const remainingDrinks = drinksCount - numTrios;

  // コンビ（ドーナツ1 + ドリンク1）を計算
  const numCombos = Math.min(remainingDonuts, remainingDrinks);

  const discount = numTrios * 70 + numCombos * 30;
  const finalTotal = total - discount;

  return { total, discount, finalTotal, numTrios, numCombos };
};