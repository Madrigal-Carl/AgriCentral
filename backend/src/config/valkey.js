import IORedis from "ioredis";

export const valkeyConnection = new IORedis({
    host: process.env.VALKEY_HOST,
    port: Number(process.env.VALKEY_PORT) || 6379,
    password: process.env.VALKEY_PASSWORD,
    username: "default",
    tls: {},
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
});

valkeyConnection.on("connect", () => {
    console.log("Valkey connected");
});

valkeyConnection.on("error", (err) => {
    console.error("Valkey connection error:", err.message);
});