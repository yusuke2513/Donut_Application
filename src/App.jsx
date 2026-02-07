import { useState } from 'react';
import { PRODUCTS } from './data/products';
import { calculateFinalTotal } from './calculate/orderLogic.js';

function App() {
  const [orders, setOrders] = useState([]);

  // 注文追加（トッピング等の拡張もここで可能）
  const addOrder = (product) => {
    setOrders([...orders, { ...product, orderId: Date.now(), status: '未提供' }]);
  };

  // 提供済み・未提供の切り替え
  const toggleStatus = (orderId) => {
    setOrders(orders.map(order => 
      order.orderId === orderId 
        ? { ...order, status: order.status === '未提供' ? '提供済み' : '未提供' } 
        : order
    ));
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '40px' }}>
      {/* 左：商品一覧（彼女さんが自由にデコレーション） */}
      <section style={{ flex: 1 }}>
        <h2>🍩 メニュー</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {PRODUCTS.map(p => (
            <button key={p.id} onClick={() => addOrder(p)} style={{ padding: '15px' }}>
              {p.name}<br/>{p.price}円
            </button>
          ))}
        </div>
      </section>

      {/* 右：注文リストと合計 */}
      <section style={{ flex: 1, borderLeft: '2px solid #eee', paddingLeft: '20px' }}>
        <h2>📋 注文メモ</h2>
        <ul>
          {orders.map(order => (
            <li key={order.orderId} style={{ marginBottom: '10px' }}>
              {order.name} 
              <button 
                onClick={() => toggleStatus(order.orderId)}
                style={{ marginLeft: '10px', backgroundColor: order.status === '提供済み' ? '#ccc' : '#ffeb3b' }}
              >
                {order.status}
              </button>
            </li>
          ))}
        </ul>
        <hr />
        <h3>合計金額: {calculateFinalTotal(orders)}円</h3>
        {/* セット割引の有無を表示 */}
        {orders.length > 0 && <p style={{ color: 'red' }}>※セット割引適用済み</p>}
      </section>
      {/* 🌟 右下の固定ボタンを追加 */}
      <button className="admin-fab" onClick={() => alert('管理画面を開きます')}>
        ドーナツの追加・削除
      </button>
    </div>
  );
}

export default App;