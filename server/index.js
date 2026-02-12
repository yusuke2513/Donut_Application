import cors from "cors";
import express from "express";
import productsRouter from "./routes/products.js";
import toppingsRouter from "./routes/toppings.js"; 


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/toppings", toppingsRouter);

/*
app.listen(3001, () => {
  console.log("🍩 API server running on http://localhost:3001");
});
*/

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // ログのメッセージを変えることで、新しいコードが動いたか確認しやすくします
  console.log(`🍩 API server is now running on port ${PORT} (Render Mode)`);
});