import { View, Text, StyleSheet } from "react-native";

export default function VendorItemScreen(){
    return (
        <View style={styles.container}>
            <Text>This is Item Page</Text>
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