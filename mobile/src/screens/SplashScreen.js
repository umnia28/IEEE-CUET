
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

const RED = "#ED234F";
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
        backgroundColor: "#ED234F",
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
    shield: {
        position: "absolute",
        top: 12,
        width: 78,
        height: 95,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.15)",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    heart: {
        position: "absolute",
        top: 20,
        right: 95,
        color: "#FF9DB0",
        fontSize: 32,
    },

    mother: {
        position: "absolute",
        bottom: 28,
        left: 132,
        width: 90,
        height: 175,
    },
    hair: {
        position: "absolute",
        top: 0,
        left: 25,
        width: 42,
        height: 45,
        borderRadius: 22,
        backgroundColor: DARK,
    },
    face: {
        position: "absolute",
        top: 25,
        left: 22,
        width: 46,
        height: 46,
        borderRadius: 25,
        backgroundColor: SKIN,
    },
    bindi: {
        position: "absolute",
        top: 35,
        left: 43,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: RED,
    },
    ear1: {
        position: "absolute",
        top: 43,
        left: 18,
        width: 8,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFD200",
    },
    ear2: {
        position: "absolute",
        top: 43,
        left: 66,
        width: 8,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFD200",
    },
    necklace: {
        position: "absolute",
        top: 70,
        left: 36,
        width: 20,
        height: 8,
        borderRadius: 10,
        borderBottomWidth: 3,
        borderColor: "#FFD200",
    },
    body: {
        position: "absolute",
        top: 72,
        left: 24,
        width: 42,
        height: 72,
        borderRadius: 18,
        backgroundColor: "#FBD1B1",
    },
    saree: {
        position: "absolute",
        top: 70,
        left: 15,
        width: 38,
        height: 92,
        borderRadius: 18,
        backgroundColor: "#FFD95C",
        transform: [{ rotate: "18deg" }],
    },
    leftArm: {
        position: "absolute",
        top: 82,
        left: 11,
        width: 13,
        height: 58,
        borderRadius: 10,
        backgroundColor: SKIN,
        transform: [{ rotate: "25deg" }],
    },
    rightArm: {
        position: "absolute",
        top: 85,
        left: 62,
        width: 13,
        height: 50,
        borderRadius: 10,
        backgroundColor: SKIN,
        transform: [{ rotate: "-30deg" }],
    },
    leg1: {
        position: "absolute",
        bottom: 0,
        left: 31,
        width: 13,
        height: 35,
        borderRadius: 8,
        backgroundColor: SKIN,
    },
    leg2: {
        position: "absolute",
        bottom: 0,
        left: 50,
        width: 13,
        height: 35,
        borderRadius: 8,
        backgroundColor: SKIN,
    },

    child: {
        position: "absolute",
        bottom: 28,
        right: 125,
        width: 80,
        height: 130,
    },
    childHair1: {
        position: "absolute",
        top: 0,
        left: 16,
        width: 34,
        height: 28,
        borderRadius: 20,
        backgroundColor: DARK,
    },
    childHair2: {
        position: "absolute",
        top: 18,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 10,
        backgroundColor: DARK,
    },
    childFace: {
        position: "absolute",
        top: 20,
        left: 19,
        width: 36,
        height: 36,
        borderRadius: 20,
        backgroundColor: SKIN,
    },
    childBody: {
        position: "absolute",
        top: 58,
        left: 18,
        width: 40,
        height: 40,
        borderRadius: 16,
        backgroundColor: "#FFB3C5",
    },
    childSkirt: {
        position: "absolute",
        top: 86,
        left: 10,
        width: 58,
        height: 28,
        borderRadius: 20,
        backgroundColor: "#FF85A1",
    },
    childLeg1: {
        position: "absolute",
        bottom: 0,
        left: 26,
        width: 10,
        height: 25,
        borderRadius: 6,
        backgroundColor: SKIN,
    },
    childLeg2: {
        position: "absolute",
        bottom: 0,
        left: 44,
        width: 10,
        height: 25,
        borderRadius: 6,
        backgroundColor: SKIN,
    },
    childArm1: {
        position: "absolute",
        top: 62,
        left: 8,
        width: 10,
        height: 38,
        borderRadius: 8,
        backgroundColor: SKIN,
        transform: [{ rotate: "35deg" }],
    },
    childArm2: {
        position: "absolute",
        top: 62,
        right: 8,
        width: 10,
        height: 36,
        borderRadius: 8,
        backgroundColor: SKIN,
        transform: [{ rotate: "-30deg" }],
    },
    shadow: {
        width: 360,
        height: 38,
        borderRadius: 80,
        backgroundColor: "rgba(131, 0, 35, 0.18)",
        marginBottom: 0,
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