# smileunion homepage clone

smileunion homepage clone – student project for the course Business AI for Marketing and Sales. Not affiliated with smileunion GmbH.

## Setup

```bash
npm install
npm run dev
```

## Deploy

- Deployed on **Vercel** from the `main` branch (every push to `main` triggers a new deployment).
- In production (`process.env.VERCEL` is set), `/` redirects to `/v2` and `/bin-ich-geeignet` redirects to `/v2/bin-ich-geeignet` (temporary 307 redirects, see `next.config.ts`). Locally, with `npm run dev`, the original pages stay reachable.
- The redesign is **desktop-first**: `HeaderV2` is used from the desktop breakpoint (**1200px**) up. Below that, the original mobile header and layout are kept, with a slim student-project notice bar on top.
- All pages are `noindex, nofollow`, and `robots.txt` disallows everything.


## How to view the website (step by step)

**1. Install Node.js (only once)** Go to https://nodejs.org, download the **LTS** version and install it (just click "Next" until it finishes). 

**2. Download the project** On this GitHub page, click the green **Code** button → **Download ZIP**. 

**3. Unzip it** Go to your Downloads folder, right-click the file `test-ai-course-main.zip` → **Extract All** → **Extract**. 

**4. Open the right folder** Open the extracted folder `test-ai-course-main`. Inside there is another folder with the same name: open that one too. You are in the right place when you see files like `package`, `README`, and the folders `src` and `public`. 

**5. Open the terminal** - 

**Windows:** right-click on an **empty white space** in that folder (not on a file) → **Open in Terminal**.
 
**Mac:** open the app **Terminal**, type `cd ` (with a space after it), drag the folder into the Terminal window and press Enter. 

**6. Type these two commands** 

npm install 

You will see red and yellow warnings — **this is normal, ignore them.**

npm run dev 

**7. Open the website** Open your browser and go to **http://localhost:3000** (If the terminal says `localhost:3001` instead, use that address.) **To stop the website:** click on the terminal window and press **Ctrl + C**. 

**Next time:** you only need steps 5, 6 (only `npm run dev`) and 7.
