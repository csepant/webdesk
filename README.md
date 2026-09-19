# Cris's Desktop

A macOS-inspired personal website built with React, TanStack Start, and Convex.

## Run locally

```sh
npm install
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local` to the existing Convex deployment. The development server runs at `http://localhost:3000`.

```sh
npm run test
npx tsc --noEmit
npm run build
```

The production build uses the existing Netlify integration. Building does not deploy the site or modify the Convex database.

## Desktop behavior

- Drag title bars and resize window edges. Red closes, yellow minimizes, and green zooms. Double-click a title bar to zoom; the Dock restores minimized windows.
- Normal window dimensions and positions remain available after zooming, minimizing, closing, and reopening during the session. Windows fit the available desktop when the viewport shrinks. On phones, windows fill the workspace above the Dock.
- Drag desktop icons to arrange them. Positions are saved in this browser once the drag finishes.
- Finder supports nested folders, back/forward navigation, breadcrumbs, grid/list views, sorting, and global filename search. Double-click items on a desktop, tap on touchscreens, or use arrow keys and Enter.
- Use Finder's `+` menu to create notes and folders. Select an item and use the actions menu (or right-click) to rename, move, or trash it. Trash supports restoring files and folder trees.
- Search from the menu bar or with `Cmd/Ctrl + K`. Native dialogs provide focus management and Escape-to-close behavior.
- Click anywhere in a window to bring it forward. Right-click the desktop, files, folders, or title bars for contextual actions.
- The Appearance menu offers Light, Dark, and System, independently of the wallpaper. System is the default and follows `prefers-color-scheme` changes live. An explicit choice is saved in localStorage under `cris-desktop-appearance-v1` and synchronized between tabs. A small head script applies the theme before the first paint.
- The default Galaxy wallpaper uses a lazy-loaded Three.js scene with an inclined stellar disk, warm core, blue outer stars, rose nebulae, and mottled dust lanes. Pause it in Appearance or choose one of the static wallpapers. Animation respects Reduce Motion and pauses in hidden tabs; mobile particle counts and pixel density are capped. WebGL failure leaves a static star field, and switching wallpapers releases the renderer's GPU resources.

## Content and persistence

`src/lib/fileSystem.ts` defines the initial portfolio and folder hierarchy. `FileSystemContext` loads existing published Convex root files and nested directories using the existing read APIs. Existing About, Projects, and Blog content takes precedence over the bundled portfolio text. The desktop tour is maintained with the frontend so its instructions stay current.

Visitor-created notes and folders are stored in localStorage under `cris-desktop-files-v1`. They are private to that browser, are not uploaded to Convex, and disappear when site data is cleared. Portfolio records are read-only in this interface. Storage failures are shown explicitly; failed writes remain available for the current session. Corrupt stored data is preserved rather than overwritten.

The contact form still submits to the existing Convex contact mutation. It disables repeated submissions and displays delivery failures without clearing the draft.

Open windows and folder/file locations are reflected in the URL. Browser-local file links only resolve in the browser that owns those files.

## Regression coverage

Vitest covers window bounds and stacking, context menu positioning and keyboard controls, nested trash/restore, cycle prevention, duplicate and invalid names, portfolio protection, note persistence, consecutive updates, browser-storage failures, and appearance persistence/system changes. The separate Vitest configuration avoids starting the Netlify and TanStack development servers during tests.
