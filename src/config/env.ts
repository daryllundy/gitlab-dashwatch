
export const env = {
  get isDevelopment() {
    return import.meta.env.DEV;
  },
  get isProduction() {
    return import.meta.env.PROD;
  },
  get mode() {
    return import.meta.env.MODE;
  },
};
