# @quasiris/docusaurus-qsc-search

## Install package

```bash
npm i @quasiris/docusaurus-qsc-search
```

## Usage package

In your Docusaurus project:

1. Add search plugin to docusaurus.config.js file:

```javascript
plugins: [
    [
      '@quasiris/docusaurus-qsc-search',
      {
        apiEndpoint: 'YOUR_API_URL',
        suggestEndpoint: 'YOUR_SUGGESTS_API_URL',
        resultKey: 'YOUR_RESULTS_KEY',
        //Optional
        searchParameters: {
          // your search parameters
        },
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
import SearchBar from '@quasiris/docusaurus-qsc-search/SearchBar';
import { usePluginData } from '@docusaurus/useGlobalData';

interface PluginData {
  suggestEndpoint: string;
  resultKey: string;
  searchParameters: {};
}

export default function ContentWrapper(props) {
  const { suggestEndpoint,resultKey,searchParameters } = usePluginData('@quasiris/docusaurus-qsc-search') as PluginData;

  return (
    <>
      <Content {...props} />
      <div className="navbar__search-container">
        <SearchBar suggestEndpoint={suggestEndpoint} resultKey={resultKey} searchParameters={searchParameters} />
      </div>
    </>
  );
}
```
4. Optional: include your SearchBar in the Nav Bar top-center including a search result page.

Here's how your src/theme/Navbar/Content/index.tsx should look:
```javascript
export default function ContentWrapper(props) {
  const { suggestEndpoint, resultKey, searchParameters } = usePluginData('@quasiris/docusaurus-qsc-search') as PluginData;
  const windowSize = useWindowSize();

  const searchContainerClass = windowSize === 'desktop' ? 'desktop-search' : 'mobile-search';
  return (
    <>
      <Content {...props} />
      <div className={`navbar__search-container ${searchContainerClass}`}>
        <SearchBar 
          apiEndpoint={apiEndpoint}
          suggestEndpoint={suggestEndpoint}
          resultKey={resultKey}
          resultPage={true}
          searchParameters={searchParameters}
        />
      </div>
    </>
  );
}
```
In your src/theme/Navbar/Content/index.tsx, the searchContainerClass is determined based on the window size.
The windowSize is typically obtained using a hook like useWindowSize from Docusaurus, which detects the current viewport size. By assigning these classes, you can customize the appearance and behavior of the search bar responsively.

**Enabling Navigation** with resultPage: true

Setting the resultPage prop to true in the SearchBar component:
```javascript
<SearchBar 
  apiEndpoint={apiEndpoint}
  suggestEndpoint={suggestEndpoint}
  resultKey={resultKey}
  resultPage={true}
  searchParameters={searchParameters}
/>
```
enables users to navigate to a dedicated search results page upon submitting a query, either by pressing Enter or clicking the search icon. This functionality enhances the user experience by providing a full-page view of search results, which is particularly useful for displaying extensive or detailed information.

5. Further Customization: Creating src/pages/search.tsx

To fully implement the search results page, you need to create a custom page at src/pages/search.tsx. This page will handle the display of search results when users navigate to it. Here's a basic example of how you might set it up including filters and pagination:

```javascript
import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  excerpt: string;
}

interface Facet {
  filterName: any;
  name: string;
  id: string;
  type: string;
  values: Array<{
    value: string;
    count: number;
    filter: string;
  }>;
}

interface Paging {
  pageCount: number;
  currentPage: number;
  firstPage: { number: number };
  lastPage: { number: number };
  nextPage?: { number: number };
  previousPage?: { number: number };
  rows: number;
}

export default function SearchPage() {
  const { apiEndpoint, resultKey, searchParameters } = usePluginData('@quasiris/docusaurus-qsc-search') as any;
  const location = useLocation();
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [paging, setPaging] = useState<Paging | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('query') || '';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const filterParams = Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith('f.'))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

    setQuery(queryParam);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { results, facets, paging } = await fetchResults(
          apiEndpoint,
          searchParameters,
          resultKey,
          queryParam,
          pageParam,
          filterParams
        );
        setResults(results);
        setFacets(facets);
        setPaging(paging);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (queryParam) {
      fetchData();
    }
  }, [location.search]);

  const handleFilterToggle = (filter: string, isChecked: boolean) => {
    const searchParams = new URLSearchParams(location.search);
    const [key, value] = filter.split('=');    
    if (isChecked) {
      searchParams.append(key, value);
    } else {
      const values = searchParams.getAll(key);
      searchParams.delete(key);
      values.filter(v => v !== value).forEach(v => searchParams.append(key, v));
      }

    searchParams.set('page', '1');
    history.push({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    history.push({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  const renderPagination = () => {
     if (!paging || paging.pageCount < 1) return null;

    const hasPrevious = paging.currentPage > 1;
    const hasNext = paging.currentPage < paging.pageCount;

    return (
      <div  className={`${styles.searchPagination}`}>
        <button
          onClick={() => handlePageChange(paging.currentPage - 1)}
          disabled={!hasPrevious}
          style={paginationButtonStyle(!hasPrevious)}
        >
          Previous
        </button>

        <span className={`${styles.textMuted}`}>
          Page {paging.currentPage} of {paging.pageCount}
        </span>

        <button
          onClick={() => handlePageChange(paging.currentPage + 1)}
          disabled={!hasNext}
          style={paginationButtonStyle(!hasNext)}
        >
          Next
        </button>
      </div>
    );
  };

  const paginationButtonStyle = (disabled: boolean) => ({
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#f5f5f5' : 'white',
    color: disabled ? '#999' : 'inherit',
    transition: 'all 0.2s ease',
    ':hover': {
      borderColor: disabled ? '#ddd' : '#3578e5'
    }
  });

  const renderFilters = () => {
    if (facets.length === 0) return null;

    return (
      <div style={{ flex: '0 0 250px' }}>
        <div className={`${styles.searchFilters}`}>
          <h2>Filters</h2>
          {facets.map((facet) => (
            <div key={facet.id} className={`${styles.searchFilterGroup}`}>
              <h3>
                {facet.name}
              </h3>
              {facet.values.map((value) => {
                  const filterKey = `${facet.filterName}=${value.value}`;
                const isChecked = new URLSearchParams(location.search)
                  .getAll(facet.filterName)
                  .includes(value.value);
                return (
                  <label 
                    key={value.filter} 
                    className={`${styles.searchFilterLabel}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleFilterToggle(filterKey, e.target.checked)}
                      className={`${styles.searchFilterCheckbox}`}
                    />
                    <span>
                      {value.value} 
                      <span className={`${styles.textMuted}`}>
                        ({value.count})
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Search Results">
      <main className={`${styles.searchPage}`}>
        <h1>
          Search Results for "{query}"
        </h1>
        
        <div className={`${styles.searchLayout}`}>
          {!isLoading && renderFilters()}

          <div className={`${styles.searchResults}`}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <span className={`${styles.textMuted}`}>
                  <svg viewBox="25 25 50 50">
                    <circle r="20" cy="50" cx="50"></circle>
                  </svg>
                </span>
              </div>
            ) : results.length === 0 ? (
              <h3 className={`${styles.textMuted}`}>No results found</h3>
            ) : (
              <>
                <div style={{ marginBottom: '2rem' }}>
                {results.map((result) => (
                  <div key={result.id} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                      <a href={result.url}>{result.title}</a>
                    </h3>
                    <p style={{ color: '#666' }}>{result.excerpt}</p>
                  </div>
                ))}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}

async function fetchResults(
  apiEndpoint: string,
  searchParameters: {},
  resultKey: string,
  query: string,
  page: number,
  filters: string[]
): Promise<{ results: SearchResult[]; facets: Facet[]; paging: Paging }> {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      ...searchParameters,
    });
    filters.forEach(filter => {
      const [key, value] = filter.split('=');
      params.append(key, value);
    });
    const response = await fetch(`${apiEndpoint}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    const pagingData = data.result[resultKey].paging || {};
    
    return {
      results: data.result[resultKey].documents?.map(item => ({
        id: item.document?.id,
        title: item.document?.title,
        url: item.document?.url,
        excerpt: item.document?.description,
      })) || [],
      facets: data.result[resultKey].facets || [],
      paging: {
        pageCount: pagingData.pageCount || 1,
        currentPage: pagingData.currentPage || 1,
        firstPage: pagingData.firstPage || { number: 1 },
        lastPage: pagingData.lastPage || { number: 1 },
        nextPage: pagingData.nextPage,
        previousPage: pagingData.previousPage,
        rows: pagingData.rows || 10
      },
    };
  } catch (error) {
    console.error('Search failed:', error);
    return { results: [], facets: [], paging: {} as Paging };
  }
}
```

6. Ensure Proper Styling:

If the SearchBar doesn't align perfectly, you may need to adjust its styles. For example, you can add custom CSS to ensure it fits well within the navbar.

Add the following to your src/css/custom.css:

```css
.navbar__search-container {
  display: flex;
  align-items: center;
}
@media (max-width: 568px) {
  .navbar--fixed-top {
    display: flex;
    flex-direction: column;
    width: 100vw;
    box-sizing: border-box; 
    height: auto;
  }

  .navbar__search-container {
    justify-content: center; 
  }
  .navbar__inner {
    position: relative !important;
  }
}
/* if SearchBar in the Nav Bar Top-Center */
.desktop-search {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  max-width: 550px !important;
  width: 100% !important;
}
.mobile-search {
 
}

```
7. Customize Styles:

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
### Top-Right Search Bar
![img.png](https://qsc-dev.quasiris.de/cdn/qsc/quasiris/Docusaurus/top-right.png)

### Center Search Bar
![img.png](https://qsc-dev.quasiris.de/cdn/qsc/quasiris/Docusaurus/center.png)

### Search Results Page
![img.png](https://qsc-dev.quasiris.de/cdn/qsc/quasiris/Docusaurus/searchPage.png)
