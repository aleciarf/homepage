# Homepage · aleciarf/homepage

Upload index.html and homepage-data.json to the root of aleciarf/homepage. The HTML includes the custom cursor; no separate image file is required. Google Fonts needs an internet connection.

Open index.html locally, or enable GitHub Pages in the repository settings. At the bottom of the homepage, expand GitHub storage.

- Load data reads homepage-data.json from the repository's default branch.
- Save data writes your profile, images, feature text, shortcuts, bookmarks and posts to that file. Saves are manual. Local edits also continue saving in the browser.
- For saving or private repository access, enter a GitHub fine-grained personal access token with access only to aleciarf/homepage and Contents read/write. The token remains in the input for this page session; it is not saved to localStorage, exported data or repository files.
- The supplied JSON contains starter data, not edits stored on your existing homepage in your browser. To transfer those edits, open the existing homepage, open browser Developer Tools > Console, and run:
  copy(localStorage.getItem('clover-desk-v1'))
  Paste the copied JSON into homepage-data.json before uploading. Avoid replacing an existing repository data file without reviewing it.
- After editing this downloaded homepage, Export current data downloads a JSON backup. Load before Save on a new device; Save refuses to overwrite a remote version you have not loaded or that has changed.
- Public repositories expose saved profile information, notes, URLs and uploaded images. Notification readings and tokens are never included in the JSON.
- GitHub Contents API limits file sizes; use small images. This is manual synchronization, not a collaborative editor.

The previous notification extension is scoped to the original hosted homepage. It will not send badges to a local HTML file or GitHub Pages until its manifest and bridge are updated for that address. Site/app shortcuts still work normally.

No files have been uploaded to GitHub by this package itself.
