export const CONFIG = {
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
  OKTO_ENDPOINT: "https://sandbox-api.okto.tech/api",
  OKTO_APP_SECRET: import.meta.env.VITE_OKTO_APP_SECRET!,
  PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY!,
  PINATA_API_SECRET: import.meta.env.VITE_PINATA_API_SECRET!,
  ALCHEMY_API_KEY: import.meta.env.VITE_ALCHEMY_API_KEY!,
  NETWORK_URL: import.meta.env.VITE_NETWORK_URL!,
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS!,
  PINATA_GATEWAY: "https://gateway.pinata.cloud",
  CHAIN_ID: "11155111", // Sepolia testnet
  NETWORK_NAME: "Sepolia",
  OKTO_APP_ID: import.meta.env.VITE_OKTO_APP_ID!,
  BASE: {
    CHAIN_ID: "8453", // Base testnet
    NETWORK_NAME: "BASE",
    NETWORK_URL: import.meta.env.VITE_BASE_TESTNET_NETWORK_URL!,
  },
  APTOS_TESTNET: {
    CHAIN_ID: "2", // Aptos testnet
    NETWORK_NAME: "APTOS_TESTNET",
    NETWORK_URL: import.meta.env.VITE_APTOS_TESTNET_NETWORK_URL!,
  },
};