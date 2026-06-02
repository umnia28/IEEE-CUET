
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { Image } from "react-native";

export default function SplashScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.logoBox} />
                    <Text style={styles.logoText}>Nirvaya</Text>
                    <Text style={styles.banglaLogo}>নির্ভয়া</Text>
                </View>

                <View style={styles.imageWrapper}>
                    <Image
                        source={require("../../assets/NirvayaApp.png")}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />

                    <View style={styles.redOverlay} />
                </View>

                <Text style={styles.title}>Safety in every step</Text>
                <Text style={styles.subtitle}>নিরাপদ থাকুন, সুরক্ষিত থাকুন</Text>

                <Text style={styles.description}>
                    Bangladesh's safety network for women and children. Help is always one
                    tap away.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate("Register")}
                >
                    <Text style={styles.primaryText}>Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.secondaryText}>Sign In</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>2,400+</Text>
                        <Text style={styles.statLabel}>Volunteers</Text>
                    </View>

                    <View style={styles.statLine} />

                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>64</Text>
                        <Text style={styles.statLabel}>Districts</Text>
                    </View>

                    <View style={styles.statLine} />

                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>98%</Text>
                        <Text style={styles.statLabel}>Response</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const RED = "#c6586f";
const LIGHT = "#FF6F8D";
const SKIN = "#FFD1A8";
const DARK = "#2A0D22";

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#FDF1F4",
    },
    container: {
        flex: 1,
        backgroundColor: RED,
        paddingHorizontal: 28,
        paddingTop: 22,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoBox: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.45)",
        marginRight: 12,
    },
    logoText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        flex: 1,
    },
    banglaLogo: {
        color: "#fff",
        fontSize: 14,
    },

    imageWrapper: {
        width: "100%",
        height: 260,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        position: "relative",
    },

    heroImage: {
        width: "100%",
        height: "100%",
    },

    redOverlay: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#c6586f",
        opacity: 0.22,
        borderRadius: 20,
    },
    bigCircle: {
        position: "absolute",
        width: 125,
        height: 125,
        borderRadius: 70,
        backgroundColor: "rgba(255,255,255,0.10)",
        left: 0,
        top: 78,
    },
    smallCircle: {
        position: "absolute",
        width: 105,
        height: 105,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.10)",
        right: 8,
        top: 40,
    },
   

    title: {
        color: "#fff",
        fontSize: 33,
        fontWeight: "900",
        textAlign: "center",
        marginTop: 12,
    },
    subtitle: {
        color: "#FFE9EE",
        textAlign: "center",
        fontSize: 18,
        marginTop: 16,
    },
    description: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        lineHeight: 24,
        marginTop: 20,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: "#fff",
        paddingVertical: 19,
        borderRadius: 18,
        alignItems: "center",
        marginTop: 4,
    },
    primaryText: {
        color: RED,
        fontSize: 17,
        fontWeight: "800",
    },
    secondaryButton: {
        paddingVertical: 19,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.65)",
        alignItems: "center",
        marginTop: 18,
    },
    secondaryText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "800",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.25)",
        marginTop: 22,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginTop: 20,
    },
    statBox: {
        alignItems: "center",
        width: 90,
    },
    statNumber: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
    },
    statLabel: {
        color: "#FFE9EE",
        fontSize: 13,
        marginTop: 3,
    },
    statLine: {
        width: 1,
        height: 54,
        backgroundColor: "rgba(255,255,255,0.25)",
    },
});