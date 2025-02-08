export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  requiredIngredients: {
    ingredientId: string;
    quantity: number;
  }[];
}

export interface Order {
  id: string;
  items: {
    menuItemId: string;
    quantity: number;
  }[];
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  totalAmount: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  ingredientId: string;
  quantityChanged: number;
  timestamp: string;
}
