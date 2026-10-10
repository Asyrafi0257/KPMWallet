import { View, Text, StyleSheet } from "react-native";

export default function VendorSettingScreen(){
    return (
        <View style={styles.container}>
            <Text>This is Setting Page</Text>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        height:100,
        flex:1,
        justifyContent: "center",
        alignItems: "center"
    }
})