import { useEffect, useState } from "react";
import { calculateFinalTotal } from "../database/orderLogic.js";
import { fetchProducts } from "../database/products";
import { fetchToppings } from "../database/toppings";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [servingQueue, setServingQueue] = useState([]); // 提供待ち用の新ステート
  const [activeTab, setActiveTab] = useState("donut"); // 初期値はドーナツ
  // DBから取得したトッピングを保存する場所
  const [availableToppings, setAvailableToppings] = useState([]);
  const [toppingTargetId, setToppingTargetId] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null); // カスタム中の商品を保存
  const [isGroupingMode, setIsGroupingMode] = useState(false); // モード切替
  const [selectedItems, setSelectedItems] = useState([]); // 箱詰め用に選択された商品のインデックス
  // uniqueBoxIds を抽出して、A, B, C... というラベルを割り当てる関数
  const uniqueBoxIds = [
    ...new Set(orders.map((item) => item.boxId).filter((id) => id)),
  ];
  const getBoxLabel = (boxId) => {
    const index = uniqueBoxIds.indexOf(boxId);
    return index !== -1 ? `グループ ${String.fromCharCode(65 + index)}` : ""; // 65は 'A' の文字コード
  };

  // useEffect を修正して、商品とトッピングを同時に取得
  useEffect(() => {
    const loadData = async () => {
      // Promise.all で効率よく並列にデータを取得します
      const [productData, toppingData] = await Promise.all([
        fetchProducts(),
        fetchToppings(),
      ]);

      setProducts(productData);
      setAvailableToppings(toppingData); // 🌟 ステートに保存
    };
    loadData();
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
      let finalOrders = [...orders];
      // 🌟 追加ポイント：もし選択中の商品があれば、自動で箱詰めを実行
      if (isGroupingMode && selectedItems.length > 0) {
        const boxId = `box-${Date.now()}`;
        selectedItems.forEach((index) => {
          finalOrders[index] = { ...finalOrders[index], boxId: boxId };
        });
      }
      // 🌟 注文全体を一つの「グループ」として作成
      const newOrderGroup = {
        groupId: Date.now(), // 一意のID
        items: finalOrders, // 注文された全商品を配列として保持
        totalPrice: finalTotal,
        status: "未提供",
      };
      // 🌟 現在の注文（orders）を servingQueue に追加し、orders を空にする
      setServingQueue([...servingQueue, newOrderGroup]);
      setOrders([]);
      // alert("お会計完了！提供待ちリストに送りました。");
      setSelectedItems([]); // 選択をクリア
      setIsGroupingMode(false); // モードを終了
    }
  };

  const handleMenuClick = (product) => {
    // 🌟 カスタムが不要な商品（例：ボールドーナツ）はそのまま追加
    if (product.name === "milkyボールドーナツ") {
      addOrder(product);
      return;
    }

    // 🌟 それ以外は「カスタム中」としてステートに保存（モーダルが開く）
    setCustomizingProduct(product);
  };

  const handleCreateBox = () => {
    const boxId = `box-${Date.now()}`; // 重複しない箱IDを作成
    const newOrders = [...orders];

    selectedItems.forEach((index) => {
      newOrders[index] = { ...newOrders[index], boxId: boxId }; // 選択した商品にIDを付与
    });

    setOrders(newOrders);
    setSelectedItems([]); // 選択をリセット
    setIsGroupingMode(false); // モード終了
  };

  const toggleItemSelection = (index) => {
    if (selectedItems.includes(index)) {
      // 🌟 すでに選択されている場合：配列から削除（解除）
      setSelectedItems(selectedItems.filter((id) => id !== index));
    } else {
      // 🌟 選択されていない場合：配列に追加（選択）
      setSelectedItems([...selectedItems, index]);
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

  return (
    <div className="container">
      {/* 左：商品一覧（メニュー） */}
      <section className="menu-section">
        <h2>🍩 メニュー</h2>
        <div className="menu-tabs">
          {["donut", "soft_cream", "drink"].map((type) => (
            <button
              key={type}
              className={`tab-button ${activeTab === type ? "active" : ""}`}
              onClick={() => setActiveTab(type)}
            >
              {type === "donut" ? "ドーナツ" : type === "soft_cream" ? "ソフトクリーム" : "ドリンク"}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {products
            .filter((p) => p.product_type === activeTab)
            .map((p) => (
              <button
                key={`${p.product_type}-${p.id}`}
                onClick={() => handleMenuClick(p)}
                className="product-button"
              >
                <span className="product-name">{p.name}</span>
                <span className="product-price">{p.price}円</span>
              </button>
            ))}
        </div>
      </section>

      {/* 中央：現在の注文リスト（レジ機能） */}
      <section className="order-section">
        <h2>📋 現在の注文</h2>
        
        {/* 箱詰めモードの操作エリア */}
        <div className="grouping-controls" style={{ marginBottom: "10px" }}>
          <button
            className={`group-btn ${isGroupingMode ? "active" : ""}`}
            onClick={() => {
              setIsGroupingMode(!isGroupingMode);
              if (!isGroupingMode) setSelectedItems([]);
            }}
            style={{
              backgroundColor: isGroupingMode ? "#fbc02d" : "#eee",
              padding: "10px",
              borderRadius: "5px",
              width: "100%",
              fontWeight: "bold"
            }}
          >
            {isGroupingMode ? "✅ 選択を完了して箱にまとめる" : "📦 注文をまとめて箱に入れる"}
          </button>
          {isGroupingMode && selectedItems.length > 0 && (
            <button
              onClick={handleCreateBox}
              style={{
                marginTop: "5px",
                width: "100%",
                backgroundColor: "#4caf50",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                fontWeight: "bold"
              }}
            >
              選択した{selectedItems.length}点を一つの箱にする
            </button>
          )}
        </div>

        <div className="order-list-container">
          {/* 1. 箱に入っていない「バラ」の商品 */}
          {orders.filter(item => !item.boxId).map((item) => {
            const originalIndex = orders.indexOf(item);
            return (
              <div
                key={item.orderId}
                className="order-item"
                onClick={() => isGroupingMode && toggleItemSelection(originalIndex)}
                style={{
                  cursor: isGroupingMode ? "pointer" : "default",
                  backgroundColor: selectedItems.includes(originalIndex) ? "#fff9c4" : "transparent",
                  border: selectedItems.includes(originalIndex) ? "2px solid #fbc02d" : "1px solid #ddd",
                  padding: "10px",
                  margin: "5px 0",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div className="order-info">
                  <span className="order-name">{item.name}</span>
                  {item.toppings?.length > 0 && (
                    <div className="order-toppings">
                      {item.toppings.map((t, i) => (
                        <span key={i} className="topping-badge clickable" onClick={(e) => { e.stopPropagation(); removeTopping(item.orderId, t.name); }}>
                          +{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="order-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {!isGroupingMode && (item.product_type === "donut" || item.product_type === "soft_cream") && (
                    <button className="add-topping-trigger" onClick={(e) => { e.stopPropagation(); setToppingTargetId(item.orderId); }}>＋</button>
                  )}
                  <span className="order-price">{item.price}円</span>
                  {!isGroupingMode && (
                    <button className="delete-order-btn" onClick={(e) => { e.stopPropagation(); removeOrder(item.orderId); }}>×</button>
                  )}
                </div>
              </div>
            );
          })}

          {/* 2. 箱詰めされたグループ */}
          {uniqueBoxIds.map((boxId) => (
            <div key={boxId} style={{ border: "2px solid #f57c00", margin: "10px 0", padding: "10px", borderRadius: "12px", backgroundColor: "#fffdf0" }}>
              <div style={{ fontWeight: "bold", color: "#f57c00", marginBottom: "5px" }}>📦 {getBoxLabel(boxId)}</div>
              {orders.filter(item => item.boxId === boxId).map((item) => {
                const originalIndex = orders.indexOf(item);
                return (
                  <div
                    key={item.orderId}
                    onClick={() => isGroupingMode && toggleItemSelection(originalIndex)}
                    style={{
                      padding: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: selectedItems.includes(originalIndex) ? "#fff9c4" : "transparent",
                      borderRadius: "5px"
                    }}
                  >
                    <div className="order-info">
                      <span>・{item.name}</span>
                      {item.toppings?.length > 0 && (
                        <div className="order-toppings">
                          {item.toppings.map((t, i) => <span key={i} className="topping-badge">+{t.name}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="order-actions">
                      <span style={{ marginRight: "10px" }}>{item.price}円</span>
                      {!isGroupingMode && (
                        <button className="delete-order-btn" onClick={(e) => { e.stopPropagation(); removeOrder(item.orderId); }}>×</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="total-area">
          <div className="summary-row">
            <span>小計:</span>
            <span>{total}円</span>
          </div>
          {discount > 0 && (
            <div className="summary-row discount-info">
              <span>セット割引 ({setCount}セット):</span>
              <span className="discount-amount">-{discount}円</span>
            </div>
          )}
          <hr />
          <div className="summary-row final-total">
            <h3>合計金額:</h3>
            <h3>{finalTotal}円</h3>
          </div>
          <button
            className="checkout-button"
            onClick={handleCheckout}
            disabled={orders.length === 0}
          >
            お会計を確定する
          </button>
        </div>
      </section>

      {/* 右：提供待ちリスト */}
      <section className="serving-section">
        <div className="section-header">
          <h2>📦 提供待ちリスト</h2>
          <button className="reset-button" onClick={clearServedItems}>リセット</button>
        </div>
        <ul className="serving-list">
          {servingQueue.map((group, index) => {
            const boxIdsInGroup = [...new Set(group.items.map(i => i.boxId).filter(id => id))];
            return (
              <li key={group.groupId} className={`serving-item ${group.status === "提供済み" ? "is-served" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <strong>注文No.{index + 1}</strong>
                  <button onClick={() => toggleServingStatus(group.groupId)} className={`status-btn ${group.status === "提供済み" ? "paid" : "unpaid"}`}>
                    {group.status}
                  </button>
                </div>
                <div className="order-group-items" style={{ width: "100%", marginTop: "10px" }}>
                  {/* バラの商品 */}
                  {group.items.filter(i => !i.boxId).map((item, idx) => (
                    <div key={idx}>
                      ・{item.name} {item.toppings?.length > 0 && `(${item.toppings.map(t => t.name).join(", ")})`}
                    </div>
                  ))}
                  {/* 箱詰め商品 */}
                  {boxIdsInGroup.map((bId, idx) => (
                    <div key={bId} style={{ border: "2px dashed #ffcc00", padding: "8px", borderRadius: "8px", margin: "5px 0", backgroundColor: "#fffdf0" }}>
                      <div style={{ fontSize: "0.8rem", color: "#f57c00", fontWeight: "bold" }}>グループ {String.fromCharCode(65 + idx)}</div>
                      {group.items.filter(i => i.boxId === bId).map((item, i) => (
                        <div key={i}>
                          ・{item.name} {item.toppings?.length > 0 && `(${item.toppings.map(t => t.name).join(", ")})`}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 右下の固定ボタン */}
      <button className="admin-fab" onClick={() => alert("管理画面を開きます")}>
        ドーナツの追加・削除
      </button>

      {/* トッピングモーダル */}
      {toppingTargetId && (
        <div className="modal-overlay">
          <div className="topping-modal">
            <h3>トッピングを追加</h3>
            {(() => {
              const currentOrder = orders.find(o => o.orderId === toppingTargetId);
              return (
                <>
                  <p>対象: {currentOrder?.name}</p>
                  <div className="topping-options">
                    {availableToppings.map((t) => {
                      const count = currentOrder?.toppings?.filter(item => item.name === t.name).length || 0;
                      return (
                        <div key={t.id || t.name} className="topping-option-row">
                          <button className="topping-select-btn" onClick={() => addTopping(toppingTargetId, t)}>
                            {t.name} (+{t.price}円) {count > 0 && <span className="topping-count"> ×{count}</span>}
                          </button>
                          {count > 0 && (
                            <button className="topping-minus-btn" onClick={() => removeTopping(toppingTargetId, t.name)}>ー</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            <button className="close-modal-btn" onClick={() => setToppingTargetId(null)}>完了</button>
          </div>
        </div>
      )}

      {/* カスタム選択モーダル（味・温度など） */}
      {customizingProduct && (
        <div className="modal-overlay">
          <div className="topping-modal">
            <h3>{customizingProduct.name} を選択</h3>
            <p style={{ marginBottom: "15px", color: "#666" }}>バリエーションを選んでください</p>
            <div className="flavor-options" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* ドーナツの味選択 */}
              {customizingProduct.product_type === "donut" && customizingProduct.name !== "milkyボールドーナツ" &&
                ["プレーン", "チョコレート", "季節限定"].map((flavor) => (
                  <button key={flavor} className="topping-select-btn" onClick={() => {
                    addOrder({ ...customizingProduct, name: `${customizingProduct.name} (${flavor})` });
                    setCustomizingProduct(null);
                  }}>{flavor}</button>
                ))}
              {/* ドリンクの温度選択 */}
              {customizingProduct.product_type === "drink" && ["Ice", "Hot"].map((temp) => (
                <button key={temp} className="topping-select-btn" onClick={() => {
                  addOrder({ ...customizingProduct, name: `${customizingProduct.name} (${temp})` });
                  setCustomizingProduct(null);
                }}>{temp}</button>
              ))}
              {/* ソフトクリームの味選択 */}
              {customizingProduct.product_type === "soft_cream" && ["プレミアムmilky", "チョコ", "ミックス"].map((flavor) => (
                <button key={flavor} className="topping-select-btn" onClick={() => {
                  const vessel = customizingProduct.name.includes("キッズ") ? "キッズ" : customizingProduct.name.includes("コーン") ? "コーン" : "カップ";
                  addOrder({ ...customizingProduct, name: `${flavor}ソフト (${vessel})` });
                  setCustomizingProduct(null);
                }}>{flavor}</button>
              ))}
            </div>
            <button className="close-modal-btn" onClick={() => setCustomizingProduct(null)} style={{ marginTop: "20px", backgroundColor: "#ccc" }}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
