# Invite Link Feature: Interview Questions (Hinglish Guide)

Yeh guide "Invite Link" autojoin feature banane mein use huye saare technical concepts cover karti hai, jaise URL parameters, Clipboard API, LocalStorage aur React Hooks.

## 1. React Router & URL Parameters

**Q: React app mein URL se query parameters (jaise `?room=XYZ`) kaise extract karte hain?**
**A:** React Router v6 mein hum `useSearchParams` hook ka use karte hain. Yeh ek array return karta hai jisme pehla value search params object hota hai, aur doosra unhe update karne ka function. Specific param nikalne ke liye `searchParams.get("room")` likha jata hai.

**Q: `useParams` aur `useSearchParams` mein actually kya difference hai?**
**A:** 
- `useParams` ko use karke hum un dynamic path variables ko access karte hain jo route pattern mein define hote hain (jaise `/lobby/:roomCode` wale route mein `useParams().roomCode` variable deta hai).
- `useSearchParams` URL ki query string (yani `?` ke baad aane wala hissa, jaise `?room=123`) ko read aur modify karne ke kaam aata hai.

## 2. Browser Web APIs

**Q: Modern web apps mein kisi text ko gracefully user ke clipboard par copy kaise karte hain?**
**A:** Iske liye Asynchronous Clipboard API ka use hota hai: `navigator.clipboard.writeText(textToCopy)`. Yeh purane aur outdated `document.execCommand('copy')` ka modern aur secure alternative hai. Dhyan rakhna chahiye ki yeh sirf HTTPS (ya localhost) par chalta hai aur generally ek direct user interaction (click wagarah) ke trigger par hi kaam karta hai.

**Q: Share karne ke liye invite link ka exact absolute URL dynamically kaise banaya gaya?**
**A:** `window.location.origin` property ka use karke. Yeh humein URL ka basic protocol, hostname, aur port number return karta hai. Isme aage humne `/?room=${roomCode}` append kar diya, jis se yeh baat guarantee ho jati hai ki link whether locally chal raha ho (`http://localhost:5173`) ya live production pe (`https://my-game.com`), theek chalega.

## 3. State Management & Persistence

**Q: User input (jaise display name) ko persist kaise rakhte hain bina kisi backend ke, taaki refresh par wo wapas na poochna pade?**
**A:** Browser ke builtin `localStorage` API ki madad se. Hum value ko `localStorage.setItem('playerName', name)` se save karte hain, aur jab retrieve karna ho to `localStorage.getItem('playerName')` use karte hain. React mein component mount hote hi default state fetch karne ke liye aise likhte hain: `useState(localStorage.getItem('playerName') || "")`.

**Q: `localStorage` aur `sessionStorage` mein basic difference kya hai?**
**A:** `localStorage` mein data permanently (ya manually clear hone tak) save rehta hai, browser close karke dobara aane par bhi. But `sessionStorage` mein data sirf current browsing session ke dauran tak valid rehta hai; ek baar tab ya window clear ki to data udd jayega.

## 4. React Component Lifecycle & UX

**Q: Jab user wapas website par aaye aur form load ho, to input element ("Display Name") par directly cursor/focus kaise auto-trigger karete hain?**
**A:** Iske liye `useEffect` hook ka istemal karte hain. Dependencies me variable pass karke fix kar sakte hain ki initial render wagarah par hi chale. Effect ke andar hum `document.getElementById('input-id').focus()` (ya theek React flow mein `useRef` hook use karke) element par directly call karte hain. Is se UX improve hota hai aur user ka ek extra mouse click save ho jata hai.
