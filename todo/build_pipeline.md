# Feature Request: Build System and Asset Minification

**Status:** Proposed
**Priority:** Medium

## Description
Implement a build pipeline using npm scripts (e.g., using `esbuild`) to minify and combine CSS and JS files for production deployments. The PHP backend should seamlessly handle switching between development and production assets.

## Requirements
- Set up a build script in `package.json` to generate `.min.css` and `.min.js` files from the source assets.
- Provide an easy command like `npm run build` to execute the minification.
- Configure PHP files to conditionally load either the raw source assets (development) or the minified assets (production) based on a `IS_DEBUG` configuration flag.

## Implementation Strategy

### 1. Configuration
Define a global environment constant in `api/config.php`:
```php
define('IS_DEBUG', true); // Set to false when deploying to the live display board
```

### 2. Asset Helper Function
Create a helper function in `api/utils.php` to handle cache-busting and minification logic:
```php
function getAssetUrl($filePath) {
    if (IS_DEBUG) {
        // In debug mode, load the raw file and append a timestamp so the browser never caches it
        $timestamp = filemtime(__DIR__ . '/../' . $filePath);
        return $filePath . '?v=' . $timestamp;
    } else {
        // In production mode, rewrite the path to point to the minified version
        // e.g., 'css/core.css' becomes 'css/core.min.css'
        $minifiedPath = preg_replace('/(\.css|\.js)$/', '.min$1', $filePath);
        
        // Append a hardcoded version number or build hash for production caching
        return $minifiedPath . '?v=1.0.0'; 
    }
}
```

### 3. Update HTML Views
Update all asset link and script tags across the application (e.g., in `index.php`, `admin.php`, `components/menu.php`) to use the helper function:
```html
<script src="<?= getAssetUrl('js/display-board.js') ?>"></script>
<link rel="stylesheet" href="<?= getAssetUrl('css/core.css') ?>">
```
