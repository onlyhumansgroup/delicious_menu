import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/lib/db';
import { id } from '@instantdb/react-native';
import type { InstaQLEntity } from '@instantdb/react-native';
import type { Schema } from '@/lib/db';

type Ingredient = InstaQLEntity<Schema, "ingredients">;

export default function InventoryScreen() {
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const { data, isLoading, error } = db.useQuery({
    ingredients: {
      $: {}
    }
  });

  // Add initial eel if no ingredients exist
  React.useEffect(() => {
    if (data?.ingredients?.length === 0) {
      db.transact(
        db.tx.ingredients[id()].update({
          name: 'Eel',
          quantity: 2
        })
      );
    }
  }, [data?.ingredients?.length]);

  const handleAddIngredient = () => {
    if (!newName || !newQuantity) return;

    const quantity = parseInt(newQuantity);
    if (isNaN(quantity)) return;

    // Check if ingredient already exists
    const existingIngredient = data?.ingredients?.find(
      ing => ing.name.toLowerCase() === newName.toLowerCase()
    );

    if (existingIngredient) {
      // Update existing ingredient quantity
      db.transact(
        db.tx.ingredients[existingIngredient.id].update({
          quantity: existingIngredient.quantity + quantity
        })
      );
    } else {
      // Add new ingredient
      db.transact(
        db.tx.ingredients[id()].update({
          name: newName,
          quantity
        })
      );
    }

    setNewName('');
    setNewQuantity('');
  };

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

  const renderItem = ({ item }: { item: Ingredient }) => (
    <ThemedView style={styles.itemContainer}>
      <ThemedText style={styles.itemName}>{item.name}</ThemedText>
      <ThemedView style={styles.quantityContainer}>
        <ThemedText style={styles.quantityText}>
          {item.quantity}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Inventory Management</ThemedText>

      <ThemedView style={styles.addForm}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={newQuantity}
          onChangeText={setNewQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddIngredient}>
          <ThemedText style={styles.addButtonText}>Add Ingredient</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {data.ingredients?.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          No ingredients found. Adding initial eel...
        </ThemedText>
      ) : (
        <FlatList
          data={data.ingredients}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ThemedView>
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
  addForm: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#666666',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  quantityContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
}); 