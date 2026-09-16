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

## Content and persistence

`src/lib/fileSystem.ts` defines the initial portfolio and folder hierarchy. `FileSystemContext` loads existing published Convex root files and nested directories using the existing read APIs. Existing About, Projects, and Blog content takes precedence over the bundled portfolio text. The desktop tour is maintained with the frontend so its instructions stay current.

Visitor-created notes and folders are stored in localStorage under `cris-desktop-files-v1`. They are private to that browser, are not uploaded to Convex, and disappear when site data is cleared. Portfolio records are read-only in this interface. Storage failures are shown explicitly; failed writes remain available for the current session. Corrupt stored data is preserved rather than overwritten.

The contact form still submits to the existing Convex contact mutation. It disables repeated submissions and displays delivery failures without clearing the draft.

Open windows and folder/file locations are reflected in the URL. Browser-local file links only resolve in the browser that owns those files.

## Regression coverage

Vitest covers window bounds, nested trash/restore, cycle prevention, duplicate and invalid names, portfolio protection, note persistence, consecutive updates, and browser-storage failures. The separate Vitest configuration avoids starting the Netlify and TanStack development servers during tests.
