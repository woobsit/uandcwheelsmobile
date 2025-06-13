// This empty export makes this file a module, which is necessary for module augmentation
export {};

// Import your defined User interface. Adjust the path if your User interface is in a different file.
import { User as AppUser } from './user.interface'; // Assuming 'User' interface is in 'src/types.ts'

// Declare that you are augmenting the 'express' module
declare global {
  namespace Express {
    // Augment the Request interface directly
    interface Request {
      // The 'user' property is added by Passport.js after successful authentication.
      // Make it optional ('?') because middleware might not have run, or auth failed.
      user?: AppUser; // Use your imported AppUser type here
    }
  }
}