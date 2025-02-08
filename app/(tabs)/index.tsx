import { init, i, InstaQLEntity } from "@instantdb/react-native";
import { View, Text, Button, StyleSheet } from "react-native";
import { addSampleData } from '@/lib/db';
import React from 'react';

// ID for app: deliciousmenu
const APP_ID = "d524e9fd-8aa1-4889-8c04-dc4abad082e1";

// Optional: You can declare a schema!
const schema = i.schema({
  entities: {
    colors: i.entity({
      value: i.string(),
    }),
  },
});

type Color = InstaQLEntity<typeof schema, "colors">;

const db = init({ appId: APP_ID, schema });

const selectId = "4d39508b-9ee2-48a3-b70d-8192d9c5a059";

export default function TabOneScreen() {
  // Initialize data when the app starts
  React.useEffect(() => {
    addSampleData();
  }, []);

  const { isLoading, error, data } = db.useQuery({
    colors: {
      $: { where: { id: selectId } },
    },
  });
  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return <Main color={data.colors[0]} />;
}

function Main(props: { color?: Color }) {
  const { value } = props.color || { value: "lightgray" };

  return (
    <View style={[styles.container, { backgroundColor: value  }]}>
      <View style={[styles.contentSection]}>
        <Text style={styles.header}>Hi! pick your favorite color</Text>
        <View style={styles.spaceX4}>
          {["green", "blue", "purple"].map((c) => {
            return (
              <Button
                title={c}
                onPress={() => {
                  db.transact(db.tx.colors[selectId].update({ value: c }));
                }}
                key={c}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spaceY4: {
    marginVertical: 16,
  },
  spaceX4: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  contentSection: {
    backgroundColor: "white",
    opacity: 0.8,
    padding: 12,
    borderRadius: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
});