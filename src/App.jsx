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
        {/* 🌟 タブボタンの配置 */}
        <div className="menu-tabs">
          <button
            className={`tab-button ${activeTab === "donut" ? "active" : ""}`}
            onClick={() => setActiveTab("donut")}
          >
            ドーナツ
          </button>
          <button
            className={`tab-button ${activeTab === "soft_cream" ? "active" : ""}`}
            onClick={() => setActiveTab("soft_cream")}
          >
            ソフトクリーム
          </button>
          <button
            className={`tab-button ${activeTab === "drink" ? "active" : ""}`}
            onClick={() => setActiveTab("drink")}
          >
            ドリンク
          </button>
        </div>

        <div className="menu-grid">
          {/* 🌟 選択中のタブ（product_type）に一致する商品だけを表示 */}
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
        {/*
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
        */}
      </section>

      {/* 中央：現在の注文リストと合計（レジ機能） */}
      <section className="order-section">
        <h2>📋 現在の注文</h2>
        {/* 🌟 箱詰めモードの切り替えボタン */}
        <div className="grouping-controls" style={{ marginBottom: "10px" }}>
          <button
            className={`group-btn ${isGroupingMode ? "active" : ""}`}
            onClick={() => {
              setIsGroupingMode(!isGroupingMode);
              if (!isGroupingMode) setSelectedItems([]); // モード終了時に選択リセット
            }}
            style={{
              backgroundColor: isGroupingMode ? "#fbc02d" : "#eee",
              padding: "10px",
              borderRadius: "5px",
              width: "100%",
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
              }}
            >
              選択した{selectedItems.length}点を一つの箱にする
            </button>
          )}
        </div>

        {/*
        <ul className="order-list">
          {// 🌟 修正ポイント：orders 1つに統合して、すべての情報をここで出す }
          {orders.map((item, index) => (
            <li
              key={index}
              className="order-item"
              onClick={() => isGroupingMode && toggleItemSelection(index)}
              style={{
                cursor: isGroupingMode ? "pointer" : "default",
                backgroundColor: selectedItems.includes(index)
                  ? "#fff9c4"
                  : "transparent",
                border: selectedItems.includes(index)
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
                <span className="order-name">
                  {item.boxId && (
                    <span style={{ color: "#f57c00", fontWeight: "bold" }}>
                      [箱詰め]{" "}
                    </span>
                  )}
                  {item.name}
                </span>

                {// 🌟 トッピングをバッジ形式で表示（クリックで削除可能） }
                {item.toppings?.length > 0 && (
                  <div className="order-toppings" style={{ marginTop: "5px" }}>
                    {[...new Set(item.toppings.map((t) => t.name))].map(
                      (name) => {
                        const count = item.toppings.filter(
                          (t) => t.name === name,
                        ).length;
                        return (
                          <span
                            key={name}
                            className="topping-badge clickable"
                            onClick={(e) => {
                              e.stopPropagation(); // 箱詰め選択が発動しないようにガード
                              removeTopping(item.orderId, name);
                            }}
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

              <div
                className="order-actions"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {// 🌟 トッピング追加ボタン（箱詰めモード以外で表示） }
                {(item.product_type === "donut" ||
                  item.product_type === "soft_cream") &&
                  !isGroupingMode && (
                    <button
                      className="add-topping-trigger"
                      onClick={(e) => {
                        e.stopPropagation(); // 親の onClick（箱詰め選択）を防止
                        setToppingTargetId(item.orderId);
                      }}
                    >
                      ＋
                    </button>
                  )}

                <span className="order-price">{item.price}円</span>
                {// 箱詰めモードじゃない時だけ削除ボタンを出す }
                {!isGroupingMode && (
                  <button
                    className="delete-order-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOrder(index);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        */}
        <ul className="order-list" style={{ listStyle: "none", padding: 0 }}>
          {/* 🌟 1. 箱に入っていない「バラ」の商品を表示 */}
          {orders
            .filter((item) => !item.boxId)
            .map((item, index) => (
              <li
                key={item.orderId}
                className="order-item" /* 既存のスタイル */
              >
                {/* 既存の商品表示コード */}
              </li>
            ))}

          {/* 🌟 2. 箱詰めされたグループごとに表示 */}
          {uniqueBoxIds.map((boxId) => (
            <div
              key={boxId}
              className="box-group-container"
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
                .map((item) => (
                  <div
                    key={item.orderId}
                    style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}
                  >
                    ・{item.name} {item.price}円
                    {!isGroupingMode && (
                      <button
                        onClick={() => removeOrder(item.orderId)}
                        style={{ float: "right" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </ul>
        {/*
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.orderId} className="order-item">
              <div className="order-info">
                <span className="order-name">{order.name}</span>

                {// 修正ポイント1: トッピングを個数まとめて表示し、クリックで消せるようにする }
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
                {// ドーナツかソフトクリームの時だけプラスボタンを表示 }
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

                {// 🌟 修正ポイント2: 注文自体を削除する「×」ボタンを追加 }
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
        */}

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
                <div className="order-group-items">
                  {/* 🌟 箱詰めされている商品をグループ表示するロジック */}
                  {group.items.map((item, idx) => {
                    // 同じ箱のものはまとめて枠で囲むなどの処理をここに書く
                    return (
                      <div
                        key={idx}
                        style={
                          item.boxId
                            ? {
                                border: "2px solid #ffcc00",
                                padding: "5px",
                                borderRadius: "5px",
                                margin: "2px 0",
                              }
                            : {}
                        }
                      >
                        ・{item.name} {item.boxId && <small>(同じ箱)</small>}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => toggleServingStatus(group.groupId)}
                  className={`status-btn ${group.status === "提供済み" ? "paid" : "unpaid"}`}
                >
                  {group.status}
                </button>
              </div>

              {/* グループ内の各商品とトッピングを表示 */}
              {/*
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
              */}
              <div className="order-group-items">
                {/* 🌟 注文内の商品を箱ごとにグルーピングして表示 */}
                {(() => {
                  const boxGroupsInServing = [
                    ...new Set(group.items.map((i) => i.boxId)),
                  ];
                  return boxGroupsInServing.map((bId) => {
                    const itemsInBox = group.items.filter(
                      (i) => i.boxId === bId,
                    );
                    const isBox = !!bId;

                    return (
                      <div
                        key={bId || "none"}
                        style={
                          isBox
                            ? {
                                border: "2px dashed #ffcc00",
                                padding: "8px",
                                borderRadius: "8px",
                                margin: "5px 0",
                              }
                            : {}
                        }
                      >
                        {isBox && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#f57c00",
                              fontWeight: "bold",
                            }}
                          >
                            {getBoxLabel(bId)}
                          </div>
                        )}
                        {itemsInBox.map((item, idx) => (
                          <div key={idx}>・{item.name}</div>
                        ))}
                      </div>
                    );
                  });
                })()}
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
                    {availableToppings.map((t) => {
                      // 現在の個数を計算
                      const count =
                        currentOrder?.toppings?.filter(
                          (item) => item.name === t.name,
                        ).length || 0;

                      return (
                        <div
                          key={t.id || t.name}
                          className="topping-option-row"
                        >
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

      {/* 🌟 カスタム選択モーダル（味・温度など） */}
      {customizingProduct && (
        <div className="modal-overlay">
          <div className="topping-modal">
            <h3>{customizingProduct.name} を選択</h3>
            <p style={{ marginBottom: "15px", color: "#666" }}>
              バリエーションを選んでください
            </p>

            <div
              className="flavor-options"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              {/* --- ドーナツの味選択 --- */}
              {customizingProduct.product_type === "donut" &&
                customizingProduct.name !== "milkyボールドーナツ" &&
                ["プレーン", "チョコレート", "季節限定"].map((flavor) => (
                  <button
                    key={flavor}
                    className="topping-select-btn"
                    onClick={() => {
                      addOrder({
                        ...customizingProduct,
                        name: `${customizingProduct.name} (${flavor})`,
                      });
                      setCustomizingProduct(null);
                    }}
                  >
                    {flavor}
                  </button>
                ))}

              {/* --- ドリンクの温度選択 --- */}
              {customizingProduct.product_type === "drink" &&
                ["Ice", "Hot"].map((temp) => (
                  <button
                    key={temp}
                    className="topping-select-btn"
                    onClick={() => {
                      addOrder({
                        ...customizingProduct,
                        name: `${customizingProduct.name} (${temp})`,
                      });
                      setCustomizingProduct(null);
                    }}
                  >
                    {temp}
                  </button>
                ))}

              {/* --- ソフトクリームのフレーバー選択 --- */}
              {customizingProduct.product_type === "soft_cream" &&
                ["プレミアムmilky", "チョコ", "ミックス"].map((flavor) => (
                  <button
                    key={flavor}
                    className="topping-select-btn"
                    onClick={() => {
                      // 器の名前を保持しつつ、フレーバーを前に持ってくる
                      const vessel = customizingProduct.name.includes("キッズ")
                        ? "キッズ"
                        : customizingProduct.name.includes("コーン")
                          ? "コーン"
                          : "カップ";
                      addOrder({
                        ...customizingProduct,
                        name: `${flavor}ソフト (${vessel})`,
                      });
                      setCustomizingProduct(null);
                    }}
                  >
                    {flavor}
                  </button>
                ))}
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setCustomizingProduct(null)}
              style={{ marginTop: "20px", backgroundColor: "#ccc" }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
