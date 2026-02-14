// database/toppings.js

export const fetchToppings = async () => {
  try {
    // スマホアクセスに対応するため、現在のホスト名を自動取得
    // const host = window.location.hostname;
    // バックエンドサーバーのポート3001へ接続
    // const response = await fetch(`http://${host}:3001/api/toppings`);
    const API_BASE_URL = "https://donut-application.onrender.com";
    const response = await fetch(`${API_BASE_URL}/api/toppings`);
    
    if (!response.ok) {
      throw new Error("トッピングデータの取得に失敗しました");
    }
    
    return await response.json();
  } catch (error) {
    console.error("fetchToppings Error:", error);
    return []; // エラー時は空配列を返してアプリが落ちるのを防ぐ
  }
};