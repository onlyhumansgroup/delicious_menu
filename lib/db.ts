import { init, i, id } from "@instantdb/react-native";

// Using the same app ID as in index.tsx
const APP_ID = "d524e9fd-8aa1-4889-8c04-dc4abad082e1";

export const schema = i.schema({
  entities: {
    ingredients: i.entity({
      name: i.string(),
      quantity: i.number(),
    }),
    menuItems: i.entity({
      name: i.string(),
      description: i.string(),
      price: i.number(),
      image: i.string(),
      requiredIngredients: i.any(),
    }),
    orders: i.entity({
      items: i.any(),
      status: i.string(),
      createdAt: i.string(),
      totalAmount: i.number(),
    }),
    transactions: i.entity({
      orderId: i.string(),
      ingredientId: i.string(),
      quantityChanged: i.number(),
      timestamp: i.string(),
    }),
  },
});

export type Schema = typeof schema;
export const db = init({ appId: APP_ID, schema });

// Add sample data
export function addSampleData() {
  db.transact((tx) => {
    // Add eel ingredient first
    const eelId = id();
    tx.ingredients[eelId].update({
      name: "Eel",
      quantity: 2,
    });

    // Add menu items
    tx.menuItems[id()].update({
      name: "Grilled Eel Bowl",
      description: "Fresh water eel grilled with our special sauce over rice",
      price: 18.99,
      image: "https://example.com/grilled-eel.jpg",
      requiredIngredients: [
        {
          ingredientId: eelId,
          quantity: 1,
        },
      ],
    });

    tx.menuItems[id()].update({
      name: "Eel Sushi Roll",
      description: "Fresh eel with cucumber and avocado",
      price: 15.99,
      image: "https://example.com/eel-roll.jpg",
      requiredIngredients: [
        {
          ingredientId: eelId,
          quantity: 0.5,
        },
      ],
    });
  });
}
