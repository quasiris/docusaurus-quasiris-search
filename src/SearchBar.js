import React, { useState, useEffect, useRef } from 'react'; 
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';
import styles from './custom.module.css';

export default function SearchBar({ apiEndpoint,apiKey,searchParams = {} }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsResultsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      setError(null);
      const fetchResults = async () => {
        try {
          const params = new URLSearchParams({
            q: debouncedQuery,
            ...searchParams,
          });
          const response = await fetch(
             `${apiEndpoint}?${params.toString()}`
          );
          const data = await response.json();
          setResults(data.result[apiKey].documents || []);
          setIsResultsVisible(true);
        } catch (error) {
          setError('Error fetching search results.');
          setIsResultsVisible(false);
        }
      };

      fetchResults();
    } else {
      setResults([]);
      setIsResultsVisible(false);
    }
  }, [debouncedQuery, apiEndpoint,searchParams]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };
  const handleRedirect = (link) => {
    window.location.href = link;
  };

  return (
    <div ref={searchContainerRef} className={styles.searchContainer}>
      <input
        type="text"
        className={clsx('navbar__search-input', styles.searchInput)}
        placeholder="Search documentation..."
        value={query}
        onChange={handleSearch}
        onFocus={() => {
          if (results.length > 0) {
            setIsResultsVisible(true);
          }
        }}
      />

      {error && <p>{error}</p>}

      {isResultsVisible && results.length > 0 && (
        <ul className={styles.searchResults}>
          {results.map((result) => (
            <li  onClick={() => handleRedirect(result?.document.url)} 
            key={result.id}>
              <Link to={result?.document.url} target="_self">
                <strong>{result.document.title || result.id}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}