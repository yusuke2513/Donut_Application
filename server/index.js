import cors from "cors";
import express from "express";
import productsRouter from "./routes/products.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);

app.listen(3001, () => {
  console.log("🍩 API server running on http://localhost:3001");
});
