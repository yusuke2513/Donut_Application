import { useEffect, useState } from "react";
import { calculateFinalTotal } from "../database/orderLogic.js";
import { fetchProducts } from "../database/products";

import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [servingQueue, setServingQueue] = useState([]); // 🌟 提供待ち用の新ステート

 useEffect(() => {
  const loadProducts = async () => {
    const data = await fetchProducts();
    console.log("取得した商品データ:", data);
    setProducts(data);
  };
  loadProducts();
}, []);

  // お会計確定ボタンの処理
  const handleCheckout = () => {
    if (orders.length === 0) return;

    const total = calculateFinalTotal(orders);
    if (
      window.confirm(
        `合計 ${total}円 です。お会計を確定して提供待ちに回しますか？`,
      )
    ) {
      // 🌟 現在の注文（orders）を servingQueue に追加し、orders を空にする
      setServingQueue([...servingQueue, ...orders]);
      setOrders([]);
      // alert("お会計完了！提供待ちリストに送りました。");
    }
  };

  // 🌟 提供待ちリスト内のステータスを切り替える関数
  const toggleServingStatus = (orderId) => {
    setServingQueue(
      servingQueue.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: order.status === "未提供" ? "提供済み" : "未提供",
            }
          : order,
      ),
    );
  };

  // 🌟 「提供済み」になった商品だけをリストから削除（リセット）する関数
  const clearServedItems = () => {
    setServingQueue(servingQueue.filter((order) => order.status === "未提供"));
  };

  // 注文追加（トッピング等の拡張もここで可能）
  const addOrder = (product) => {
    setOrders([
      ...orders,
      { ...product, orderId: Date.now(), status: "未提供" },
    ]);
  };

  // 提供済み・未提供の切り替え
  const toggleStatus = (orderId) => {
    setOrders(
      orders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: order.status === "未提供" ? "提供済み" : "未提供",
            }
          : order,
      ),
    );
  };

  return (
    <div className="container">
      {/* 左：商品一覧（メニュー） */}
      <section className="menu-section">
        <h2>🍩 メニュー</h2>
        <div className="menu-grid">
          {products.map((p) => (
            <button
              key={`${p.product_type}-${p.id}`}
              onClick={() => addOrder(p)}
              className="product-button"
            >
              <span className="product-name">{p.name}</span>
              <span className="product-price">{p.price}円</span>
            </button>
          ))}
        </div>
      </section>

      {/* 中央：現在の注文リストと合計（レジ機能） */}
      <section className="order-section">
        <h2>📋 現在の注文</h2>
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.orderId} className="order-item">
              {order.name}
              {/* レジ中なので、ここではまだ「提供済み」ボタンは不要かもしれません */}
            </li>
          ))}
        </ul>
        <hr />
        <div className="total-area">
          <h3>合計金額: {calculateFinalTotal(orders)}円</h3>
          {/* 割引表示のロジック */}
          {calculateFinalTotal(orders) <
            orders.reduce((sum, i) => sum + i.price, 0) && (
            <p className="discount-tag">※ドーナツ＆ドリンク セット割引適用！</p>
          )}
          {/* お会計確定ボタン */}
          <button
            className="checkout-button"
            onClick={handleCheckout}
            disabled={orders.length === 0}
          >
            お会計を確定する
          </button>
        </div>
      </section>

      {/* 右：提供待ちリスト（キッチン・配膳管理） */}
      <section className="serving-section">
        <div className="section-header">
          <h2>📦 提供待ちリスト</h2>
          {/* 提供済みになったものだけを消去するボタン */}
          <button className="reset-button" onClick={clearServedItems}>
            提供済みをリセット
          </button>
        </div>
        <ul className="serving-list">
          {servingQueue.map((item) => (
            <li
              key={item.orderId}
              className={`serving-item ${item.status === "提供済み" ? "is-served" : ""}`}
            >
              <span className="item-info">{item.name}</span>
              <button
                onClick={() => toggleServingStatus(item.orderId)}
                className={`status-btn ${item.status === "提供済み" ? "paid" : "unpaid"}`}
              >
                {item.status}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 右下の固定ボタン */}
      <button className="admin-fab" onClick={() => alert("管理画面を開きます")}>
        ドーナツの追加・削除
      </button>
    </div>
  );
}

export default App;
