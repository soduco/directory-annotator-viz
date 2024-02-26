export {};

declare global {
 interface Window {
   _env_: {
    REACT_APP_STORAGE_URI: string;
    REACT_APP_STORAGE_AUTH_TOKEN: string;
    REACT_APP_COMPUTE_URI : string;
    REACT_APP_COMPUTE_AUTH_TOKEN : string;
   };
 }
}