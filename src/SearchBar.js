import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';
import styles from './custom.module.css';

export default function SearchBar({ apiEndpoint, apiKey, searchParameters = {} }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const resultsListRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsResultsVisible(false);
        setSelectedIndex(-1);
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
            ...searchParameters,
          });
          const response = await fetch(`${apiEndpoint}?${params.toString()}`);
          const data = await response.json();
          const newResults = data.result[apiKey].documents || [];
          setResults(newResults);
          setSelectedIndex(newResults.length > 0 ? 0 : -1);
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
      setSelectedIndex(-1);
    }
  }, [debouncedQuery, apiEndpoint, searchParameters]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsListRef.current) {
      const items = resultsListRef.current.children;
      if (items && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  const handleRedirect = (link) => {
    window.location.href = link;
  };
  const highlightMatches = (text) => {
    if (!query.trim()) return text;

    // Escape special regex characters and split query into terms
    const terms = query
      .trim()
      .split(/\s+/)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(term => term.length > 0);

    if (terms.length === 0) return text;

    // Create regex pattern for matching any term
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <strong key={index} className={styles.highlight}>
          {part}
        </strong>
      ) : (
        part
      )
    );
  };
  const handleKeyDown = (e) => {
    if (!isResultsVisible || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          return (prev + 1) % results.length;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          return (prev - 1 + results.length) % results.length;
        });
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const url = results[selectedIndex].document.url;
          handleRedirect(url);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={searchContainerRef} className={`${styles.searchContainer} qsc-search-container`}>
      <input
        type="text"
        className={`${clsx('navbar__search-input', styles.searchInput)} qsc-search-input`}
        placeholder="Search documentation..."
        value={query}
        onChange={handleSearch}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setIsResultsVisible(true);
          }
        }}
      />

      {error && <p>{error}</p>}

      {isResultsVisible && results.length > 0 && (
        <ul ref={resultsListRef} className={styles.searchResults}>
          {results.map((result, index) => (
            <li
              onClick={() => handleRedirect(result?.document.url)}
              onMouseEnter={() => setSelectedIndex(index)}
              key={result.id}
              className={clsx(styles.resultItem, {
                [styles.selectedItem]: index === selectedIndex,
              })}
            >
              <Link to={result?.document.url} target="_self">
                <strong>{highlightMatches(result.document.title || result.id)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}