import { productSchema } from "../server/validation";
import { catalogRows } from "./catalog-data";

const brands: Record<string, string> = {
  women: "Terra Studio",
  men: "Terra Everyday",
  kids: "Terra Mini",
  footwear: "Terra Stride",
  accessories: "Terra Accents",
};
// What the piece is, for the package list and copy ("Dress", "Pair of sneakers").
const itemName = (sub: string, name: string) => {
  const last = name.split(" ").at(-1)!;
  if (
    sub === "Kids Footwear" ||
    /Sneakers|Sandals|Boots|Flats|Loafers|Shoes|Pumps|Mules|Janes|Slippers|Flip-Flops/.test(
      name,
    )
  )
    return /Janes|Pumps/.test(name)
      ? "Pair of shoes"
      : `Pair of ${last.toLowerCase()}`;
  return last;
};
function sizes(category: string, sub: string, name: string) {
  if (category === "accessories") return ["One Size"];
  if (category === "kids") return ["2–3Y", "4–5Y", "6–7Y", "8–9Y", "10–11Y"];
  if (sub === "Kids Footwear")
    return ["UK 10C", "UK 12C", "UK 1", "UK 2", "UK 3"];
  if (category === "footwear")
    return ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
  if (/Jeans|Trousers|Chino|Corduroy/.test(name))
    return category === "men"
      ? ["28", "30", "32", "34", "36", "38"]
      : ["26", "28", "30", "32", "34"];
  return ["XS", "S", "M", "L", "XL", "XXL"];
}
const occasions: Record<string, string> = {
  Dresses: "brunches, birthday dinners and evenings out",
  Tops: "college days, coffee runs and easy weekends",
  Shirts: "the office, presentations and smart-casual Fridays",
  "Jeans & Trousers": "everyday wear, travel and casual workdays",
  Skirts: "workdays, brunch dates and holiday plans",
  Shorts: "hot afternoons, holidays and lazy weekends",
  "Jackets & Coats": "chilly mornings, travel and winter evenings",
  Jackets: "cooler evenings, road trips and winter commutes",
  "Sweaters & Sweatshirts": "winter mornings, travel days and weekend plans",
  "T-Shirts": "everyday wear, the gym bag and weekend plans",
  Activewear: "workouts, morning runs and active weekends",
  "Frocks & Dresses": "birthday parties, family functions and play dates",
  "Tops & Tees": "school holidays, play time and family outings",
  "Sweaters & Jackets": "winter school runs and holiday trips",
  Bottoms: "play time, outings and everyday comfort",
  Heels: "parties, weddings and evenings out",
  Flats: "long workdays, shopping and everyday errands",
  Sandals: "summer days, holidays and casual outings",
  Sneakers: "daily walks, college and casual weekends",
  Boots: "monsoon days, winter trips and city walks",
  "Loafers & Formal": "the office, formal events and smart-casual days",
  "Slippers & Flip-Flops": "home, the beach and quick errands",
  "Kids Footwear": "school, play time and family outings",
  "Caps & Hats": "sunny days, travel and winter outings",
};
const care = (material: string, category: string) =>
  category === "footwear"
    ? "Wipe clean with a soft, dry cloth. Air dry away from direct heat. Store in a cool, dry place."
    : category === "accessories"
      ? "Hand wash gently in cold water. Reshape and dry flat in shade."
      : /satin|chiffon|georgette|lace|crepe|wool|merino/i.test(material)
        ? "Hand wash or gentle machine wash in cold water. Do not wring. Dry in shade. Warm iron on reverse."
        : /denim/i.test(material)
          ? "Machine wash cold, inside out, with similar colours. Do not bleach. Dry in shade."
          : "Machine wash cold with similar colours. Do not bleach. Tumble dry low or dry in shade.";

export const catalogProducts = catalogRows.map(
  (
    [slug, category, subCategory, name, colour, price, originalPrice, material],
    i,
  ) => {
    const image = `/images/catalog/${slug}.webp`;
    const piece = itemName(subCategory, name).toLowerCase();
    const description =
      `${name} in ${colour.toLowerCase()}, made from ${material.toLowerCase()}. ` +
      `A versatile ${piece} for ${occasions[subCategory] || "everyday wear"}. ` +
      (category === "footwear"
        ? "Cushioned for comfort through the day and easy to pair with denim, dresses or ethnic wear."
        : category === "accessories"
          ? "A finishing touch that pulls an outfit together in seconds."
          : category === "kids"
            ? "Soft, easy to wear and made to keep up with little adventures."
            : "Pair it with your favourite basics or dress it up with statement accessories.");
    return productSchema.parse({
      name,
      slug: `c-${slug}`,
      brand: brands[category],
      category,
      subCategory,
      price,
      originalPrice,
      // Spread of stock levels, including a few that are running low.
      stock: i % 13 === 5 ? 3 : 6 + ((i * 7) % 35),
      image,
      gallery: [image, `/images/catalog/${slug}-detail.webp`],
      description,
      material,
      care: care(material, category),
      colors: [colour],
      sizes: sizes(category, subCategory, name),
      packageContents: [{ name: itemName(subCategory, name), quantity: 1 }],
      published: true,
      featured: i % 6 === 0,
      displayOrder: 200 + i,
      topTenRank: null,
      searchPriority: 50,
      searchKeywords: [
        subCategory.toLowerCase(),
        category,
        colour.toLowerCase(),
        ...material
          .toLowerCase()
          .split(/[ ,]+/)
          .filter((w) => w.length > 3),
      ],
      seoTitle: `${name} | ${brands[category]}`.slice(0, 70),
      seoDescription:
        `${name} in ${colour.toLowerCase()} by ${brands[category]}. ${material}. Shop ${subCategory.toLowerCase()} online.`.slice(
          0,
          170,
        ),
    });
  },
);
