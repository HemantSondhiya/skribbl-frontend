# Invite Link Feature: Interview Questions & Guide

This guide covers all the technical aspects involved in implementing the "Invite Link" auto-join feature, which involves URL parameters, the Clipboard API, LocalStorage, and React Hooks.

## 1. React Router & URL Parameters

**Q: How do you extract query parameters (like `?room=XYZ`) from a URL in a React application?**
**A:** In React Router v6, you use the `useSearchParams` hook. It returns an array with two values: the search params object and a function to update them. You can get a specific parameter using `searchParams.get("room")`.

**Q: What is the difference between `useParams` and `useSearchParams` in React Router?**
**A:** 
- `useParams` is used to access dynamic path parameters defined in the route pattern (e.g., in `/lobby/:roomCode`, `useParams().roomCode` gets the value).
- `useSearchParams` is used to read and modify the query string of the URL (the part after the `?`, like `?room=123`).

## 2. Browser Web APIs

**Q: How do you pragmatically copy text to a user's clipboard in modern JavaScript?**
**A:** By using the asynchronous Clipboard API: `navigator.clipboard.writeText(textToCopy)`. This is the modern, secure way to interact with the clipboard, replacing the old `document.execCommand('copy')` method. Note that it requires the page to be served over HTTPS (or localhost) and must be triggered by a direct user interaction (like a click).

**Q: How did you generate the full absolute URL for the invite link dynamically?**
**A:** By using `window.location.origin`. This property returns the protocol, hostname, and port number of a URL. By appending `/?room=${roomCode}` to it, you guarantee the link works correctly regardless of whether the app is running locally (`http://localhost:5173`) or in production (`https://my-game.com`).

## 3. State Management & Persistence

**Q: How do you persist user inputs (like a player's display name) so they don't have to re-enter it every time they visit the site?**
**A:** Using the browser's `localStorage` API. You can save the name using `localStorage.setItem('playerName', name)` and retrieve it using `localStorage.getItem('playerName')`. In React, you can initialize your state with this stored value: `useState(localStorage.getItem('playerName') || "")`.

**Q: What is the difference between `localStorage` and `sessionStorage`?**
**A:** `localStorage` persists data even after the browser is closed and reopened, with no expiration time. `sessionStorage` only keeps the data for the duration of the page session (it gets cleared when the tab or window is closed).

## 4. React Component Lifecycle & UX

**Q: How can you automatically focus on an input field (like "Display Name") when a component renders, based on certain conditions?**
**A:** By using a `useEffect` hook. You can add a dependency array so it strictly runs when those specific conditions change. Inside the effect, you can select the element (e.g., via `document.getElementById('input-id').focus()` or using a React `useRef`) to set the browser's focus to that element, saving the user a click.
