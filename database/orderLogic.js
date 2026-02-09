// calculate/orderLogic.js

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
