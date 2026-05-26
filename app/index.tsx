import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: '缘分天定' }} />
      <View style={styles.container}>
        <Text style={styles.title}>缘分天定</Text>
        <Text style={styles.subtitle}>KindredSouls</Text>
        <Text style={styles.desc}>输入双方生日，测算缘分指数</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="你的生日（如 1990-01-01）"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="TA的生日（如 1992-05-20）"
            placeholderTextColor="#999"
          />
          <View style={styles.btn}>
            <Button title="测算缘分" onPress={() => Alert.alert('功能开发中')} color="#81D8D0" />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 18, color: '#81D8D0', marginTop: 4, marginBottom: 24 },
  desc: { fontSize: 16, color: '#666', marginBottom: 32 },
  form: { width: '100%', maxWidth: 340 },
  input: {
    width: '100%', height: 48, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 16, fontSize: 16, marginBottom: 16, color: '#222',
  },
  btn: { marginTop: 8, borderRadius: 8, overflow: 'hidden' },
});
