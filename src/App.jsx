import { useState } from "react";
import { PRODUCTS } from "./data/products";
import { calculateFinalTotal } from "./calculate/orderLogic.js";
import "./App.css";

function App() {
  const [orders, setOrders] = useState([]);

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
      {/* 左：商品一覧 */}
      <section className="menu-section">
        <h2>🍩 メニュー</h2>
        <div className="menu-grid">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => addOrder(p)}
              className="product-button"
            >
              <span className="product-name">{p.name}</span>
              <span className="product-price">{p.price}円</span>
            </button>
          ))}
        </div>
      </section>

      {/* 右：注文リストと合計 */}
      <section className="order-section">
        <h2>📋 注文メモ</h2>
        <ul>
          {orders.map((order) => (
            <li key={order.orderId} style={{ marginBottom: "10px" }}>
              {order.name}
              <button
                onClick={() => toggleStatus(order.orderId)}
                style={{
                  marginLeft: "10px",
                  backgroundColor:
                    order.status === "提供済み" ? "#ccc" : "#ffeb3b",
                }}
              >
                {order.status}
              </button>
            </li>
          ))}
        </ul>
        <hr />
        <h3>合計金額: {calculateFinalTotal(orders)}円</h3>
        {/* セット割引の有無を表示 */}
        {/*
        {orders.length > 0 && (
          <p style={{ color: "red" }}>※セット割引適用済み</p>
        )}
        */}
        {/* 実際に割引が発生しているかチェック */}
        {calculateFinalTotal(orders) <
          orders.reduce((sum, i) => sum + i.price, 0) && (
          <p className="discount-tag">
            ※ドーナツ＆ソフトクリーム セット割引適用！
          </p>
        )}
      </section>
      {/* 🌟 右下の固定ボタンを追加 */}
      <button className="admin-fab" onClick={() => alert("管理画面を開きます")}>
        ドーナツの追加・削除
      </button>
    </div>
  );
}

export default App;
