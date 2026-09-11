const aliases: Record<string, string> = {
  sari: "saree",
  sarees: "saree",
  saris: "saree",
  saari: "saree",
  sare: "saree",
  pent: "pant",
  paint: "pant",
  pants: "pant",
  trouser: "pant",
  trousers: "pant",
  kurtas: "kurta",
  kurtis: "kurti",
  kurtha: "kurta",
  lehanga: "lehenga",
  lehngha: "lehenga",
  tshirt: "tshirt",
  tees: "tshirt",
  tee: "tshirt",
  shoes: "shoe",
  chappal: "sandal",
  sandals: "sandal",
};
export function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .replace(/t-shirts?/g, "tshirt")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .map((s) => aliases[s] || s)
    .join(" ");
}
