export interface Location {
  id?: string; // id might be optional if not always present in every context
  name: string;
  state: string;
  terminal?: string; 
  createdAt?: string;
  updatedAt?: string;
}

// export interface CreateLocationData {
//   name: string;
//   code?: string;
//   timezone?: string;
// }
