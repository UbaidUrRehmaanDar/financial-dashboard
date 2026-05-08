const API_KEY = "d7usf29r01qnv95onodgd7usf29r01qnv95onoe0";
const BASE = "https://finnhub.io/api/v1";

export async function getQuote(symbol) {
  const res = await fetch(`${BASE}/quote?symbol=${symbol}&token=${API_KEY}`);
  return res.json();
}

export async function getCandles(symbol, from, to, resolution = "60") {
  const res = await fetch(`${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`);
  return res.json();
}