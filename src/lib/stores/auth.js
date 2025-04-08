import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Check if we're in a browser environment and if the user is already authenticated
const storedAuth = browser ? localStorage.getItem('authenticated') : null;

// Create a writable store with the initial value from localStorage or false
export const authenticated = writable(storedAuth === 'true');

// Subscribe to changes and update localStorage
if (browser) {
  authenticated.subscribe(value => {
    localStorage.setItem('authenticated', value.toString());
  });
}

// Function to check if the provided password is correct
export function checkPassword(password) {
  // Get the password from the environment variable
  const correctPassword = import.meta.env.VITE_PASSWORD;
  
  if (password === correctPassword) {
    authenticated.set(true);
    return true;
  }
  return false;
}

// Function to log out
export function logout() {
  authenticated.set(false);
}
