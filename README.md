# docusaurus-quasiris-search

## Install package

npm i docusaurus-quasiris-search

## usage package

In your Docusaurus project:

1. Add search plugin to docusaurus.config.js file:

```
plugins: [
    [
      'docusaurus-quasiris-search',
      {
        apiEndpoint: 'YOUR_API_URL',
        indexName: 'YOUR_INDEX_NAME',
      },
    ],
  ],
```

2. Swizzle the Navbar/Content component to add your SearchBar directly into the navbar's layout.

```
npm run swizzle @docusaurus/theme-classic Navbar/Content -- --wrap
```

This will create a Navbar/Content component in your src/theme directory.

3. Update the Navbar/Content component to include your SearchBar in the top-right corner.

Here's how your src/theme/Navbar/Content/index.tsx should look:
```
import React from 'react';
import Content from '@theme-original/Navbar/Content';
import SearchBar from 'docusaurus-quasiris-search/SearchBar';
import { usePluginData } from '@docusaurus/useGlobalData';

interface PluginData {
  apiEndpoint: string;
  indexName: string;
}

export default function ContentWrapper(props) {
  const { apiEndpoint,indexName } = usePluginData('docusaurus-quasiris-search') as PluginData;

  return (
    <>
      <Content {...props} />
      <div className="navbar__search-container">
        <SearchBar apiEndpoint={apiEndpoint} indexName={indexName} />
      </div>
    </>
  );
}
```

4. Ensure Proper Styling:

If the SearchBar doesn't align perfectly, you may need to adjust its styles. For example, you can add custom CSS to ensure it fits well within the navbar.

Add the following to your src/css/custom.css:

```html
.navbar__search-container {
  display: flex;
  align-items: center;
  margin-left: auto;
}
```