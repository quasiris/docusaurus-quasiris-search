import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './custom.module.css';

export default function SearchPage() {
  const { apiEndpoint, resultKey, searchParameters } = usePluginData('@quasiris/docusaurus-qsc-search');
  const location = useLocation();
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState([]);
  const [paging, setPaging] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFacets, setExpandedFacets] = useState({});
  const [sortOptions, setSortOptions] = useState([]);
  const [selectedSort, setSelectedSort] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('query') || '';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const sortParam = searchParams.get('sort') || '';
    const filterParams = Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith('f.'))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

    setQuery(queryParam);
    setSelectedSort(sortParam);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { results, facets, paging, total, sortOptions } = await fetchResults(
          apiEndpoint,
          searchParameters,
          resultKey,
          queryParam,
          pageParam,
          filterParams,
          sortParam
        );
        setResults(results);
        setFacets(facets);
        setPaging(paging);
        setTotalResults(total);
        setSortOptions(sortOptions);
        
        const initialExpandedState = {};
        facets.forEach(facet => {
          initialExpandedState[facet.id] = false;
        });
        setExpandedFacets(initialExpandedState);
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

  useEffect(() => {
    
    const handlePopState = () => {
      // The navbar search bar will automatically update due to the useLocation effect
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const toggleFacetExpansion = (facetId) => {
    setExpandedFacets(prev => ({
      ...prev,
      [facetId]: !prev[facetId]
    }));
  };

  const handleFilterToggle = (filter, isChecked) => {
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

  const handlePageChange = (page) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    history.push({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  const handleSortChange = (sortId) => {
    const searchParams = new URLSearchParams(location.search);
    if (sortId) {
      searchParams.set('sort', sortId);
    } else {
      searchParams.delete('sort');
    }
    searchParams.set('page', '1');
    history.push({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  const renderPagination = () => {
    if (!paging || paging.pageCount <= 1) return null;

    const hasPrevious = paging.currentPage > 1;
    const hasNext = paging.currentPage < paging.pageCount;

    return (
      <div className={styles.searchPagination}>
        <button
          onClick={() => handlePageChange(paging.currentPage - 1)}
          disabled={!hasPrevious}
          className={styles.paginationButton}
        >
          Previous
        </button>

        <span className={styles.paginationInfo}>
          Page {paging.currentPage} of {paging.pageCount}
        </span>

        <button
          onClick={() => handlePageChange(paging.currentPage + 1)}
          disabled={!hasNext}
          className={styles.paginationButton}
        >
          Next
        </button>
      </div>
    );
  };

  const renderSortOptions = () => {
    if (sortOptions.length === 0) return null;

    return (
      <div className={styles.sortContainer}>
        <label htmlFor="sort-select" className={styles.sortLabel}>
          Sort by:
        </label>
        <select
          id="sort-select"
          value={selectedSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className={styles.sortSelect}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderFilters = () => {
    if (results.length === 0) return;
    return (
      <div className={styles.filtersSidebar}>
        <div className={styles.searchFilters}>
          {facets.map((facet) => {
            const selectedValues = facet.values.filter(value => {
              const isChecked = new URLSearchParams(location.search)
                .getAll(facet.filterName)
                .includes(value.value);
              return isChecked;
            });

            const nonSelectedValues = facet.values.filter(value => {
              const isChecked = new URLSearchParams(location.search)
                .getAll(facet.filterName)
                .includes(value.value);
              return !isChecked;
            });

            const isExpanded = expandedFacets[facet.id];
            
            const visibleNonSelected = isExpanded 
              ? nonSelectedValues 
              : nonSelectedValues.slice(0, Math.max(0, 5 - selectedValues.length));
            
            const visibleValues = [...selectedValues, ...visibleNonSelected];
            const hasMore = nonSelectedValues.length > Math.max(0, 5 - selectedValues.length);;
            const buttonText = isExpanded ? 'Show less' : `Show ${nonSelectedValues.length - visibleNonSelected.length} more`;

            return (
              <div key={facet.id} className={styles.searchFilterGroup}>
                <h3>{facet.name}</h3>
                {visibleValues.map((value) => {
                  const isChecked = new URLSearchParams(location.search)
                    .getAll(facet.filterName)
                    .includes(value.value);
                  
                  return (
                    <label 
                      key={value.filter} 
                      className={styles.searchFilterLabel}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleFilterToggle(value.filter, e.target.checked)}
                        className={styles.searchFilterCheckbox}
                      />
                      <span className={styles.filterText}>
                        {value.value} 
                        <span className={styles.filterCount}>
                          ({value.count})
                        </span>
                      </span>
                    </label>
                  );
                })}
                
                {hasMore && (
                  <button
                    onClick={() => toggleFacetExpansion(facet.id)}
                    className={styles.expandButton}
                  >
                     {buttonText}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
     <Layout title="Search Results">
      <main className={styles.searchPage}>
         <div className={styles.searchResultContainer}>        
          <div className={styles.searchLayout}>
            {!isLoading && renderFilters()}

            <div className={styles.searchContent}>
              {!isLoading && results.length > 0 && (
                <div className={styles.resultsHeader}>
                  {!isLoading && query && (
                    <span className={styles.resultsCount}>{totalResults} results found for "{query}"</span>
                  )}
                  {renderSortOptions()}
                </div>
              )}
              
              <div className={styles.searchResults}>
                {isLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                    <span className={styles.loadingText}>Searching...</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className={styles.noResults}>
                    <h3>No results found</h3>
                    {query && (
                      <p>Try adjusting your search terms or filters to find what you're looking for.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={styles.resultsList}>
                      {results.map((result) => (
                        <div key={result.id} className={styles.searchResultItem}>
                          <h3 className={styles.resultTitle}>
                            <a href={result.url} className={styles.resultLink}>
                              {result.title}
                            </a>
                          </h3>
                          {result.excerpt && (
                            <p className={styles.resultExcerpt}>{result.excerpt}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {renderPagination()}
                  </>
                )}
              </div>
            </div>
          </div>
         </div>
      </main>
    </Layout>
  );
}

async function fetchResults(
  apiEndpoint,
  searchParameters,
  resultKey,
  query,
  page,
  filters,
  sort
) {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      ...searchParameters,
    });
    
    if (sort) {
      params.set('sort', sort);
    }
    
    filters.forEach(filter => {
      const [key, value] = filter.split('=');
      params.append(key, value);
    });
    
    const response = await fetch(`${apiEndpoint}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    const resultData = data.result[resultKey];
    const pagingData = resultData.paging || {};
    const total = resultData.total || 0;
    const sortData = resultData.sort || {};

    const sortOptions = sortData.sort || [
      { id: 'score', name: 'Relevance', selected: true },
      { id: 'titledesc', name: 'Title Z-A' },
      { id: 'titleasc', name: 'Title A-Z' }
    ];

    return {
      results: resultData.documents?.map(item => ({
        id: item.document?.id,
        title: item.document?.title,
        url: item.document?.url,
        excerpt: item.document?.description,
        position: item.position,
        fieldCount: item.fieldCount
      })) || [],
      facets: resultData.facets || [],
      paging: {
        pageCount: pagingData.pageCount || 1,
        currentPage: pagingData.currentPage || 1,
        firstPage: pagingData.firstPage || { number: 1 },
        lastPage: pagingData.lastPage || { number: 1 },
        nextPage: pagingData.nextPage,
        previousPage: pagingData.previousPage,
        rows: pagingData.rows || 10
      },
      total,
      sortOptions
    };
  } catch (error) {
    console.error('Search failed:', error);
    return { 
      results: [], 
      facets: [], 
      paging: {}, 
      total: 0, 
      sortOptions: [] 
    };
  }
}