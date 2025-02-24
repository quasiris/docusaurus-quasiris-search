# docusaurus-quasiris-search

## Install package

```bash
npm i docusaurus-quasiris-search
```

## Usage package

In your Docusaurus project:

1. Add search plugin to docusaurus.config.js file:

```javascript
plugins: [
    [
      'docusaurus-quasiris-search',
      {
        apiEndpoint: 'YOUR_API_URL',
        apiKey: 'YOUR_API_KEY',
        searchParameters: {},
      },
    ],
  ],
```

2. Swizzle the Navbar/Content component to add your SearchBar directly into the navbar's layout.

```bash
npm run swizzle @docusaurus/theme-classic Navbar/Content -- --wrap
```

This will create a Navbar/Content component in your src/theme directory.

3. Update the Navbar/Content component to include your SearchBar in the top-right corner.

Here's how your src/theme/Navbar/Content/index.tsx should look:
```javascript
import React from 'react';
import Content from '@theme-original/Navbar/Content';
import SearchBar from 'docusaurus-quasiris-search/SearchBar';
import { usePluginData } from '@docusaurus/useGlobalData';

interface PluginData {
  apiEndpoint: string;
  apiKey: string;
  searchParameters: {};
}

export default function ContentWrapper(props) {
  const { apiEndpoint,apiKey,searchParameters } = usePluginData('docusaurus-quasiris-search') as PluginData;

  return (
    <>
      <Content {...props} />
      <div className="navbar__search-container">
        <SearchBar apiEndpoint={apiEndpoint} apiKey={apiKey} searchParams={searchParameters} />
      </div>
    </>
  );
}
```

4. Ensure Proper Styling:

If the SearchBar doesn't align perfectly, you may need to adjust its styles. For example, you can add custom CSS to ensure it fits well within the navbar.

Add the following to your src/css/custom.css:

```css
.navbar__search-container {
  display: flex;
  align-items: center;
  margin-left: auto;
}
```
  5. Customize Styles:

Override CSS variables or target global classes in your project's src/css/custom.css.

```css

/* global plugin overrides */
.qsc-search-container{
  --search-container-padding: 2rem;
  --search-container-width: 400px;
}

/* search input overrides */
.qsc-search-input{
  color: #850000;
}

/* light theme overrides */
[data-theme='light'] .qsc-search-container {
  --search-results-background-color: #25b1bb; 
  --search-result-hover-color: #9c9c9c; 
  --search-input-border-color: #4e3bf6; 
  --search-input-border:1px solid #4e3bf6;
  --search-results-border-color: #850000;
}

/* Dark theme overrides */
[data-theme='dark'] .qsc-search-container {
  --search-results-background-color: #700e0e; 
  --search-result-hover-color: #25b1bb; 
  --search-input-border-color: #3b82f6; 
  --search-results-border-color: #2d2d2d; 
}
```
