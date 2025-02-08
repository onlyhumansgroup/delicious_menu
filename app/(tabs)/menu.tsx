import React, { useState } from 'react';
import { StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/lib/db';
import type { InstaQLEntity } from '@instantdb/react-native';
import type { Schema } from '@/lib/db';

type MenuItem = InstaQLEntity<Schema, "menuItems">;
type Ingredient = InstaQLEntity<Schema, "ingredients">;

export default function MenuScreen() {
  const { data, isLoading, error } = db.useQuery({
    menuItems: {
      $: {}
    },
    ingredients: {
      $: {}
    }
  });

  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Error: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  const getMaxOrderQuantity = (menuItem: MenuItem) => {
    if (!menuItem.requiredIngredients || !data.ingredients) return 0;
    
    const quantities = menuItem.requiredIngredients.map(req => {
      const ingredient = data.ingredients.find(ing => ing.id === req.ingredientId);
      return ingredient ? Math.floor(ingredient.quantity / req.quantity) : 0;
    });
    
    return quantities.length > 0 ? Math.min(...quantities) : 0;
  };

  const updateOrderQuantity = (menuItemId: string, delta: number) => {
    setOrderQuantities(prev => ({
      ...prev,
      [menuItemId]: Math.max(0, (prev[menuItemId] || 0) + delta)
    }));
  };

  const submitOrder = async () => {
    if (!data.menuItems) return;

    const orderItems = Object.entries(orderQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity
      }));

    if (orderItems.length === 0) return;

    const totalAmount = orderItems.reduce((total, item) => {
      const menuItem = data.menuItems.find(mi => mi.id === item.menuItemId);
      return total + (menuItem?.price || 0) * item.quantity;
    }, 0);

    // Create order and related transactions in a single transaction
    await db.transact([
      db.tx.orders.create({
        items: orderItems,
        status: 'completed',
        createdAt: new Date().toISOString(),
        totalAmount
      }),
      ...orderItems.flatMap(item => {
        const menuItem = data.menuItems?.find(mi => mi.id === item.menuItemId);
        return menuItem?.requiredIngredients.flatMap(req => [
          db.tx.ingredients.update({
            where: { id: req.ingredientId },
            data: {
              quantity: { $dec: req.quantity * item.quantity }
            }
          }),
          db.tx.transactions.create({
            orderId: '$LAST_ID', // References the ID of the order we just created
            ingredientId: req.ingredientId,
            quantityChanged: -(req.quantity * item.quantity),
            timestamp: new Date().toISOString()
          })
        ]) ?? [];
      })
    ]);

    // Reset order quantities
    setOrderQuantities({});
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>Menu</ThemedText>
      {data.menuItems?.map(item => {
        const maxQuantity = getMaxOrderQuantity(item);
        const currentQuantity = orderQuantities[item.id] || 0;

        return (
          <ThemedView key={item.id} style={styles.menuItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <ThemedView style={styles.itemDetails}>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
              <ThemedText style={styles.itemPrice}>${item.price.toFixed(2)}</ThemedText>
              
              <ThemedView style={styles.orderControls}>
                <TouchableOpacity 
                  onPress={() => updateOrderQuantity(item.id, -1)}
                  disabled={currentQuantity === 0}>
                  <ThemedText style={styles.controlButton}>-</ThemedText>
                </TouchableOpacity>
                
                <ThemedText style={styles.quantity}>{currentQuantity}</ThemedText>
                
                <TouchableOpacity 
                  onPress={() => updateOrderQuantity(item.id, 1)}
                  disabled={currentQuantity >= maxQuantity}>
                  <ThemedText style={styles.controlButton}>+</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.available}>
                  (Max: {maxQuantity})
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        );
      })}

      <TouchableOpacity 
        style={[
          styles.submitButton,
          Object.values(orderQuantities).every(q => q === 0) && styles.submitButtonDisabled
        ]}
        onPress={submitOrder}
        disabled={Object.values(orderQuantities).every(q => q === 0)}>
        <ThemedText style={styles.submitButtonText}>Submit Order</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    color: '#000000',
  },
  menuItem: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  itemDetails: {
    padding: 16,
    gap: 8,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  itemDescription: {
    fontSize: 16,
    color: '#666666',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginTop: 4,
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  controlButton: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    minWidth: 24,
    textAlign: 'center',
  },
  available: {
    fontSize: 14,
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 