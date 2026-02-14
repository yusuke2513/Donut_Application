// data/products.js


export async function fetchProducts() {
  // const res = await fetch('http://localhost:3001/api/products');
  // const res = await fetch('http://192.168.1.7:3001/api/products');
  const res = await fetch('https://donut-application.onrender.com/api/products');
  return await res.json();
}
