declare module 'react-native-cookies' {
  interface Cookie {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    version?: string;
    expiration?: string;
    secure?: boolean;
    httpOnly?: boolean;
  }

  interface Cookies {
    [key: string]: Cookie;
  }

  interface CookieManager {
    set(
      url: string,
      cookie: {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        version?: string;
        expires?: string;
        secure?: boolean;
        httpOnly?: boolean;
      }
    ): Promise<void>;
    
    get(url: string): Promise<Cookies>;
    clearByName(url: string, name: string, path?: string): Promise<void>;
    clearAll(): Promise<void>;
  }

  const CookieManager: CookieManager;
  export default CookieManager;
}