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
  // 🌟 App関数の冒頭（useStateの集まり）に追加
  const [orderType, setOrderType] = useState("TO"); // 初期値はテイクアウト(TO)
  const [tempToppings, setTempToppings] = useState([]); // モーダル内で一時的に選ぶトッピング
  const [selectedVariation, setSelectedVariation] = useState(null); // 味や温度

  // 🌟 個数を変更する関数
  const updateQuantity = (orderId, delta) => {
    setOrders(
      orders.map((order) =>
        order.orderId === orderId
          ? { ...order, quantity: Math.max(1, (order.quantity || 1) + delta) }
          : order,
      ),
    );
  };

  // 🌟 バリエーション名とトッピングを受け取って注文に追加する
  const addOrder = (product, variationName, toppings = []) => {
    const finalName = variationName
      ? `${product.name} (${variationName})`
      : product.name;

    setOrders([
      ...orders,
      {
        ...product,
        name: finalName,
        orderId: Date.now(),
        toppings: toppings,
        orderType: orderType, // 前のターンで追加したIN/TO情報
        quantity: 1,
        status: "未提供",
      },
    ]);
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

  const { total, discount, finalTotal, numTrios, numCombos } =
    calculateFinalTotal(orders);

  return (
    <div className="container">
      {/* 左：商品一覧（メニュー） */}
      <section className="menu-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        ></div>
        <h2>🍩 メニュー</h2>

        {/* 🌟 3番：IN/TO切り替えボタン */}
        <div className="in-to-toggle" style={{ display: "flex", gap: "5px" }}>
          <button
            onClick={() => setOrderType("IN")}
            style={{
              backgroundColor: orderType === "IN" ? "#2c3e50" : "#eee",
              color: orderType === "IN" ? "white" : "black",
              padding: "8px 15px",
              borderRadius: "5px",
            }}
          >
            IN
          </button>
          <button
            onClick={() => setOrderType("TO")}
            style={{
              backgroundColor: orderType === "TO" ? "#2c3e50" : "#eee",
              color: orderType === "TO" ? "white" : "black",
              padding: "8px 15px",
              borderRadius: "5px",
            }}
          >
            TO
          </button>
        </div>
        <div className="menu-tabs">
          {["donut", "soft_cream", "drink"].map((type) => (
            <button
              key={type}
              className={`tab-button ${activeTab === type ? "active" : ""}`}
              onClick={() => setActiveTab(type)}
            >
              {type === "donut"
                ? "ドーナツ"
                : type === "soft_cream"
                  ? "ソフトクリーム"
                  : "ドリンク"}
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

      {/* 中央：現在の注文リスト */}
      <section className="order-section">
        <h2>📋 現在の注文</h2>
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
              fontWeight: "bold",
            }}
          >
            {isGroupingMode
              ? "✅ 選択を完了して箱にまとめる"
              : "📦 注文をまとめて箱に入れる"}
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
                fontWeight: "bold",
              }}
            >
              選択した{selectedItems.length}点を一つの箱にする
            </button>
          )}
        </div>

        <div className="order-list-container">
          {/* 1. バラの商品 */}
          {orders
            .filter((item) => !item.boxId)
            .map((item) => {
              const originalIndex = orders.indexOf(item);
              return (
                <div
                  key={item.orderId}
                  className="order-item"
                  onClick={() =>
                    isGroupingMode && toggleItemSelection(originalIndex)
                  }
                  style={{
                    cursor: isGroupingMode ? "pointer" : "default",
                    backgroundColor: selectedItems.includes(originalIndex)
                      ? "#fff9c4"
                      : "transparent",
                    border: selectedItems.includes(originalIndex)
                      ? "2px solid #fbc02d"
                      : "1px solid #ddd",
                    padding: "10px",
                    margin: "5px 0",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="order-info">
                    {/* 🌟 IN/TOのバッジを表示 */}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        background: "#333",
                        color: "#fff",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        marginRight: "5px",
                      }}
                    >
                      {item.orderType}
                    </span>
                    <span className="order-name">{item.name}</span>
                    {item.toppings?.length > 0 && (
                      <div
                        className="order-toppings"
                        style={{ marginTop: "5px" }}
                      >
                        {item.toppings.map((t, i) => (
                          <span key={i} className="topping-badge">
                            +{t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="order-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* 🌟 2. 個数選択 (+/-) */}
                    {!isGroupingMode && (
                      <div
                        className="quantity-controls"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginRight: "10px",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.orderId, -1);
                          }}
                          style={{ width: "25px" }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            minWidth: "20px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.orderId, 1);
                          }}
                          style={{ width: "25px" }}
                        >
                          +
                        </button>
                      </div>
                    )}
                    {/* 単価×個数で計算 */}
                    <span className="order-price">
                      {item.price * (item.quantity || 1)}円
                    </span>
                    {!isGroupingMode && (
                      <button
                        className="delete-order-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOrder(item.orderId);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* 2. 箱詰めされたグループ */}
          {uniqueBoxIds.map((boxId) => (
            <div
              key={boxId}
              style={{
                border: "2px solid #f57c00",
                margin: "10px 0",
                padding: "10px",
                borderRadius: "12px",
                backgroundColor: "#fffdf0",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  color: "#f57c00",
                  marginBottom: "5px",
                }}
              >
                📦 {getBoxLabel(boxId)}
              </div>
              {orders
                .filter((item) => item.boxId === boxId)
                .map((item) => {
                  const originalIndex = orders.indexOf(item);
                  return (
                    <div
                      key={item.orderId}
                      onClick={() =>
                        isGroupingMode && toggleItemSelection(originalIndex)
                      }
                      style={{
                        padding: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: selectedItems.includes(originalIndex)
                          ? "#fff9c4"
                          : "transparent",
                        borderRadius: "5px",
                      }}
                    >
                      <div className="order-info">
                        <span
                          style={{
                            fontSize: "0.7rem",
                            background: "#333",
                            color: "#fff",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            marginRight: "5px",
                          }}
                        >
                          {item.orderType}
                        </span>
                        <span>・{item.name}</span>
                        {item.toppings?.length > 0 && (
                          <div className="order-toppings">
                            {item.toppings.map((t, i) => (
                              <span key={i} className="topping-badge">
                                +{t.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className="order-actions"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {/* 🌟 箱の中でも個数選択ができるように配置 */}
                        {!isGroupingMode && (
                          <div
                            className="quantity-controls"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.orderId, -1);
                              }}
                            >
                              -
                            </button>
                            <span>{item.quantity || 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.orderId, 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                        <span style={{ marginRight: "10px" }}>
                          {item.price * (item.quantity || 1)}円
                        </span>
                        {!isGroupingMode && (
                          <button
                            className="delete-order-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOrder(item.orderId);
                            }}
                          >
                            ×
                          </button>
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
          {/* ... 割引や合計表示 ... */}
          {/* 🌟 割引メッセージの表示エリア */}
          {discount > 0 && (
            <div
              className="discount-messages"
              style={{
                margin: "10px 0",
                padding: "10px",
                backgroundColor: "#fff9c4",
                borderRadius: "8px",
                border: "1px dashed #fbc02d",
              }}
            >
              {numTrios > 0 && (
                <div
                  style={{
                    color: "#f57c00",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  🍩🍩🥤 ドーナツトリオ適用！ (x{numTrios})：-{numTrios * 70}円
                </div>
              )}
              {numCombos > 0 && (
                <div
                  style={{
                    color: "#f57c00",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  🍩🥤 ドーナツコンビ適用！ (x{numCombos})：-{numCombos * 30}円
                </div>
              )}
            </div>
          )}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #ddd",
              margin: "10px 0",
            }}
          />

          {/* 3. 最終的な合計金額 */}
          <div
            className="summary-row final-total"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>合計金額:</h3>
            <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "1.6rem" }}>
              {finalTotal}円
            </h3>
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
          <button className="reset-button" onClick={clearServedItems}>
            リセット
          </button>
        </div>
        <ul className="serving-list">
          {servingQueue.map((group, index) => {
            // 🌟 1. この注文グループ内の「箱ID」を抽出
            const boxIdsInGroup = [
              ...new Set(group.items.map((i) => i.boxId).filter((id) => id)),
            ];

            // 🌟 2. 商品を集計するヘルパー関数（名前、トッピング、IN/TO、箱IDが同じなら合算）
            const getSummarizedItems = (items) => {
              const summary = [];
              items.forEach((item) => {
                const toppingKey =
                  item.toppings
                    ?.map((t) => t.name)
                    .sort()
                    .join(",") || "";
                // 全く同じ条件のものを探すためのキーを作成
                const key = `${item.name}-${toppingKey}-${item.orderType}-${item.boxId}`;

                const existing = summary.find((s) => s.summaryKey === key);
                if (existing) {
                  existing.totalQty += item.quantity || 1;
                } else {
                  summary.push({
                    ...item,
                    summaryKey: key,
                    totalQty: item.quantity || 1,
                  });
                }
              });
              return summary;
            };

            const allSummarized = getSummarizedItems(group.items);

            return (
              <li
                key={group.groupId}
                className={`serving-item ${group.status === "提供済み" ? "is-served" : ""}`}
                style={{
                  position: "relative",
                  padding: "15px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ fontSize: "1.2rem", color: "#2c3e50" }}>
                    注文No.{index + 1}
                  </strong>
                </div>

                <div
                  className="order-group-items"
                  style={{ width: "100%", paddingBottom: "40px" }}
                >
                  {/* 🌟 3. バラの商品（集計済み）を表示 */}
                  {allSummarized
                    .filter((i) => !i.boxId)
                    .map((item, idx) => (
                      <div key={idx} style={{ marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            background: "#333",
                            color: "#fff",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            marginRight: "5px",
                          }}
                        >
                          {item.orderType}
                        </span>
                        ・{item.name}
                        <strong style={{ marginLeft: "5px", color: "#e53935" }}>
                          x{item.totalQty}
                        </strong>
                        {item.toppings?.length > 0 &&
                          ` (${item.toppings.map((t) => t.name).join(", ")})`}
                      </div>
                    ))}

                  {/* 🌟 4. 箱詰め商品（集計済み）を表示 */}
                  {boxIdsInGroup.map((bId, idx) => (
                    <div
                      key={bId}
                      style={{
                        border: "2px dashed #ffcc00",
                        padding: "8px",
                        borderRadius: "8px",
                        margin: "8px 0",
                        backgroundColor: "#fffdf0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#f57c00",
                          fontWeight: "bold",
                        }}
                      >
                        グループ {String.fromCharCode(65 + idx)}
                      </div>
                      {allSummarized
                        .filter((i) => i.boxId === bId)
                        .map((item, i) => (
                          <div key={i}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                background: "#333",
                                color: "#fff",
                                padding: "2px 4px",
                                borderRadius: "3px",
                                marginRight: "5px",
                              }}
                            >
                              {item.orderType}
                            </span>
                            ・{item.name}
                            <strong
                              style={{ marginLeft: "5px", color: "#e53935" }}
                            >
                              x{item.totalQty}
                            </strong>
                            {item.toppings?.length > 0 &&
                              ` (${item.toppings.map((t) => t.name).join(", ")})`}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "15px",
                    right: "15px",
                  }}
                >
                  <button
                    onClick={() => toggleServingStatus(group.groupId)}
                    className={`status-btn ${group.status === "提供済み" ? "paid" : "unpaid"}`}
                  >
                    {group.status}
                  </button>
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
      {customizingProduct && (
        <div className="modal-overlay">
          <div
            className="topping-modal"
            style={{ maxWidth: "500px", width: "90%" }}
          >
            <h3>{customizingProduct.name} のカスタマイズ</h3>
            <div className="variation-section" style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                バリエーションを選択
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {customizingProduct.product_type === "donut" &&
                  customizingProduct.name !== "milkyボールドーナツ" &&
                  ["プレーン", "チョコレート", "季節限定"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariation(v)}
                      style={{
                        backgroundColor:
                          selectedVariation === v ? "#2c3e50" : "#f5f5f5",
                        color: selectedVariation === v ? "white" : "black",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                {customizingProduct.product_type === "drink" &&
                  ["Ice", "Hot"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariation(v)}
                      style={{
                        backgroundColor:
                          selectedVariation === v ? "#2c3e50" : "#f5f5f5",
                        color: selectedVariation === v ? "white" : "black",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                {customizingProduct.product_type === "soft_cream" &&
                  ["プレミアムmilky", "チョコ", "ミックス"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariation(v)}
                      style={{
                        backgroundColor:
                          selectedVariation === v ? "#2c3e50" : "#f5f5f5",
                        color: selectedVariation === v ? "white" : "black",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      {v}
                    </button>
                  ))}
              </div>
            </div>
            <div
              className="topping-section"
              style={{ borderTop: "1px solid #eee", paddingTop: "15px" }}
            >
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                トッピングを追加
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {availableToppings.map((t) => {
                  const isSelected = tempToppings.some(
                    (item) => item.name === t.name,
                  );
                  return (
                    <button
                      key={t.name}
                      onClick={() => {
                        isSelected
                          ? setTempToppings(
                              tempToppings.filter(
                                (item) => item.name !== t.name,
                              ),
                            )
                          : setTempToppings([...tempToppings, t]);
                      }}
                      style={{
                        backgroundColor: isSelected ? "#ffcc00" : "#f5f5f5",
                        border: isSelected
                          ? "2px solid #f57c00"
                          : "1px solid #ddd",
                        padding: "8px",
                        borderRadius: "5px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {t.name} (+{t.price}円) {isSelected && "✅"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  addOrder(customizingProduct, selectedVariation, tempToppings);
                  setCustomizingProduct(null);
                  setSelectedVariation(null);
                  setTempToppings([]);
                }}
                disabled={
                  !selectedVariation &&
                  customizingProduct.name !== "milkyボールドーナツ"
                }
                style={{
                  flex: 2,
                  padding: "15px",
                  backgroundColor: "#4caf50",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  opacity:
                    !selectedVariation &&
                    customizingProduct.name !== "milkyボールドーナツ"
                      ? 0.5
                      : 1,
                }}
              >
                確定して追加
              </button>
              <button
                onClick={() => {
                  setCustomizingProduct(null);
                  setSelectedVariation(null);
                  setTempToppings([]);
                }}
                style={{
                  flex: 1,
                  padding: "15px",
                  backgroundColor: "#ccc",
                  borderRadius: "8px",
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
