// data/products.js


export async function fetchProducts() {
  const res = await fetch('http://localhost:3001/api/products');
  return await res.json();
}
