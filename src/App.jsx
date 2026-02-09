import { useEffect, useState } from "react";
import { calculateFinalTotal } from "../database/orderLogic.js";
import { fetchProducts } from "../database/products";

import "./App.css";

// 利用可能なトッピング一覧(後で消す．将来的にはDBから取得する想定)
const AVAILABLE_TOPPINGS = [
  { name: "カラースプレー", price: 30 },
  { name: "チョコチップ", price: 30 },
];

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

    const { finalTotal } = calculateFinalTotal(orders);

    if (
      window.confirm(
        `合計 ${finalTotal}円 です。お会計を確定して提供待ちに回しますか？`,
      )
    ) {
      // 🌟 注文全体を一つの「グループ」として作成
      const newOrderGroup = {
        groupId: Date.now(), // 一意のID
        items: [...orders], // 注文された全商品を配列として保持
        totalPrice: finalTotal,
        status: "未提供",
      };
      // 🌟 現在の注文（orders）を servingQueue に追加し、orders を空にする
      setServingQueue([...servingQueue, newOrderGroup]);
      setOrders([]);
      // alert("お会計完了！提供待ちリストに送りました。");
    }
  };

  // 🌟 提供待ちリスト内のステータスを切り替える関数（グループ単位）
  const toggleServingStatus = (groupId) => {
    setServingQueue(
      servingQueue.map((group) =>
        group.groupId === groupId
          ? {
              ...group,
              status: group.status === "未提供" ? "提供済み" : "未提供",
            }
          : group,
      ),
    );
  };

  // 🌟 「提供済み」になったグループをリストから削除（リセット）
  const clearServedItems = () => {
    setServingQueue(servingQueue.filter((group) => group.status === "未提供"));
  };

  // 注文追加（トッピング等の拡張もここで可能）
  const addOrder = (product) => {
    setOrders([
      ...orders,
      { ...product, orderId: Date.now(), toppings: [], status: "未提供" },
    ]);
  };

  const addTopping = (orderId, topping) => {
    setOrders(
      orders.map((order) =>
        order.orderId === orderId
          ? { ...order, toppings: [...order.toppings, topping] } // 🌟 既存のトッピングに追加
          : order,
      ),
    );
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

  // 1. 商品（注文）そのものを削除する関数
  const removeOrder = (orderId) => {
    setOrders(orders.filter((order) => order.orderId !== orderId));
  };

  // 2. 特定のトッピングを1つだけ削除する関数
  const removeTopping = (orderId, toppingName) => {
    setOrders(
      orders.map((order) => {
        if (order.orderId === orderId) {
          // 同じ名前のトッピングの中から「最後に追加された1つ」を探して削除
          const lastIndex = [...order.toppings]
            .reverse()
            .findIndex((t) => t.name === toppingName);
          if (lastIndex !== -1) {
            const actualIndex = order.toppings.length - 1 - lastIndex;
            const newToppings = [...order.toppings];
            newToppings.splice(actualIndex, 1);
            return { ...order, toppings: newToppings };
          }
        }
        return order;
      }),
    );
  };

  const { total, discount, finalTotal, setCount } = calculateFinalTotal(orders);
  const [toppingTargetId, setToppingTargetId] = useState(null); // トッピング中の orderId を保存

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
              <div className="order-info">
                <span className="order-name">{order.name}</span>

                {/* 🌟 修正ポイント1: トッピングを個数まとめて表示し、クリックで消せるようにする */}
                {order.toppings?.length > 0 && (
                  <div className="order-toppings">
                    {[...new Set(order.toppings.map((t) => t.name))].map(
                      (name) => {
                        const count = order.toppings.filter(
                          (t) => t.name === name,
                        ).length;
                        return (
                          <span
                            key={name}
                            className="topping-badge clickable"
                            onClick={() => removeTopping(order.orderId, name)}
                            title="クリックで1つ削除"
                          >
                            +{name} {count > 1 ? `x${count}` : ""}
                          </span>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              <div className="order-actions">
                {/* ドーナツかソフトクリームの時だけプラスボタンを表示 */}
                {(order.product_type === "donut" ||
                  order.product_type === "soft_cream") && (
                  <button
                    className="add-topping-trigger"
                    onClick={() => setToppingTargetId(order.orderId)}
                  >
                    ＋
                  </button>
                )}
                <span className="order-price">{order.price}円</span>

                {/* 🌟 修正ポイント2: 注文自体を削除する「×」ボタンを追加 */}
                <button
                  className="delete-order-btn"
                  onClick={() => removeOrder(order.orderId)}
                  title="注文を削除"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/*
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.orderId} className="order-item">
              {order.name}
              // レジ中なので、ここではまだ「提供済み」ボタンは不要かもしれません
            </li>
          ))}
        </ul>
        */}
        <hr />
        <div className="total-area">
          {/* 1. 小計（定価の合計）の表示 */}
          <div className="summary-row">
            <span>小計:</span>
            <span>{total}円</span>
          </div>

          {/* 2. 割引がある場合だけ内訳を表示 */}
          {discount > 0 && (
            <div className="summary-row discount-info">
              <span>セット割引 ({setCount}セット):</span>
              <span className="discount-amount">-{discount}円</span>
            </div>
          )}

          <hr />

          {/* 3. 最終的な合計金額 */}
          <div className="summary-row final-total">
            <h3>合計金額:</h3>
            <h3>{finalTotal}円</h3>
          </div>

          {/* 4. 割引適用のメッセージタグ */}
          {discount > 0 && (
            <p className="discount-tag">
              ※ドーナツ＆ドリンク セット割引適用中！
            </p>
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
          <button className="reset-button" onClick={clearServedItems}>
            提供済みをリセット
          </button>
        </div>
        <ul className="serving-list">
          {servingQueue.map((group, index) => (
            <li
              key={group.groupId}
              className={`serving-item ${group.status === "提供済み" ? "is-served" : ""}`}
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                {/* 🌟 注文Noはインデックス+1で表示 */}
                <strong style={{ fontSize: "1.1rem", color: "#2c3e50" }}>
                  注文No.{index + 1}
                </strong>
                <button
                  onClick={() => toggleServingStatus(group.groupId)}
                  className={`status-btn ${group.status === "提供済み" ? "paid" : "unpaid"}`}
                >
                  {group.status}
                </button>
              </div>

              {/* グループ内の各商品とトッピングを表示 */}
              <div
                className="order-group-items"
                style={{ width: "100%", paddingLeft: "10px" }}
              >
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "5px",
                      fontSize: "0.9rem",
                      color: "#333",
                    }}
                  >
                    ・{item.name}
                    {item.toppings?.length > 0 && (
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>
                        （{item.toppings.map((t) => t.name).join(", ")}）
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 右下の固定ボタン */}
      <button className="admin-fab" onClick={() => alert("管理画面を開きます")}>
        ドーナツの追加・削除
      </button>

      {/* トッピングモーダル部分 */}
      {toppingTargetId && (
        <div className="modal-overlay">
          <div className="topping-modal">
            <h3>トッピングを追加</h3>

            {/* 🌟 1. データの特定を最初に行い、変数 currentOrder をこのブロック全体で使えるようにします */}
            {(() => {
              const currentOrder = orders.find(
                (o) => o.orderId === toppingTargetId,
              );

              return (
                <>
                  <p>対象: {currentOrder?.name}</p>

                  <div className="topping-options">
                    {AVAILABLE_TOPPINGS.map((t) => {
                      // 現在の個数を計算
                      const count =
                        currentOrder?.toppings?.filter(
                          (item) => item.name === t.name,
                        ).length || 0;

                      return (
                        <div key={t.name} className="topping-option-row">
                          {/* 2. メインの追加ボタン */}
                          <button
                            className="topping-select-btn"
                            onClick={() => addTopping(toppingTargetId, t)}
                          >
                            {t.name} (+{t.price}円)
                            {count > 0 && (
                              <span className="topping-count"> ×{count}</span>
                            )}
                          </button>

                          {/* 3. 削除（マイナス）ボタン */}
                          {count > 0 && (
                            <button
                              className="topping-minus-btn"
                              onClick={() =>
                                removeTopping(toppingTargetId, t.name)
                              }
                              title="1つ減らす"
                            >
                              ー
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            <button
              className="close-modal-btn"
              onClick={() => setToppingTargetId(null)}
            >
              完了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
