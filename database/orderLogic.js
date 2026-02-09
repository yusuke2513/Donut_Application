// calculate/orderLogic.js

/*
export const calculateFinalTotal = (orders) => {
  // 合計金額
  const total = orders.reduce((sum, order) => {
    return sum + order.price;
  }, 0);

  // セット割引（例：3個以上で100円引き）
  // const discount = orders.length >= 3 ? 100 : 0;

  // ドーナツとドリンクの数をそれぞれ数える
  const donutCount = orders.filter(order => order.product_type === 'donut').length;
  const drinkCount = orders.filter(order => order.product_type === 'drink').length;

  // 🌟 ここで「何個と判定されたか」を表示
  console.log(`判定結果 -> ドーナツ: ${donutCount}個, ドリンク: ${drinkCount}個`);

  // セット数を決定（少ない方の数）
  const sets = Math.min(donutCount, drinkCount);

  // セット割引（1セットにつき30円）
  const discount = sets * 30;

  // return total - discount;
  // 4. 全データが入ったオブジェクトを返す
  return {
    total: total,
    discount: discount,
    finalTotal: total - discount,
    setCount: sets
  };
};
*/

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