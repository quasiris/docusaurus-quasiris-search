import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';
import styles from './custom.module.css';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useLocation } from '@docusaurus/router';

export default function SearchBar({ suggestEndpoint, apiEndpoint, resultKey, searchParameters = {}, resultPage = false }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const resultsListRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlQuery = urlParams.get('query') || '';
      setQuery(urlQuery);
    }
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsResultsVisible(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length > 1 && !isSelectingSuggestion) {
      const fetchSuggestions = async () => {
        try {
          const params = new URLSearchParams({ q: debouncedQuery, ...searchParameters });
          const response = await fetch(`${suggestEndpoint}?${params.toString()}`);
          const data = await response.json();
          const newSuggestions = Array.isArray(data) ? data : [];
          setSuggestions(newSuggestions);
          setSelectedIndex(-1);
          setIsResultsVisible(inputFocused && newSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setIsResultsVisible(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setIsResultsVisible(false);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery, suggestEndpoint, searchParameters, inputFocused, isSelectingSuggestion]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsListRef.current) {
      const items = resultsListRef.current.children;
      if (items && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleInputFocus = () => {
    setInputFocused(true);
    if (suggestions.length > 0) setIsResultsVisible(true);
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for click events to complete
    setTimeout(() => {
      if (!isSelectingSuggestion) {
        setInputFocused(false);
        setIsResultsVisible(false);
      }
    }, 150);
  };

  const handleSearch = (e) => setQuery(e.target.value);

  const handleRedirectToSearchPage = (q) => {
    setIsSelectingSuggestion(true);
    if (ExecutionEnvironment.canUseDOM) {
      window.location.href = `/search?query=${encodeURIComponent(q)}`;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setIsSelectingSuggestion(true);
    setIsResultsVisible(false);
    setSelectedIndex(-1);
    handleRedirectToSearchPage(suggestion);
  };

  const highlightMatches = (text) => {
    if (!query.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText.startsWith(lowerQuery)) {
      const typedPart = text.substring(0, query.length);
      const restPart = text.substring(query.length);
      return (
        <>
          <span>{typedPart}</span>
          <strong>{restPart}</strong>
        </>
      );
    }
    return text;
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSuggestionClick(suggestions[selectedIndex].suggest);
    } else {
      handleRedirectToSearchPage(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
      return; 
    }

    if (isResultsVisible && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Escape':
          setIsResultsVisible(false);
          setSelectedIndex(-1);
          break;
        default:
          break;
      }
    }
  };

  return (
    <div ref={searchContainerRef} className={`${styles.searchContainer} qsc-search-container`}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={`${clsx(styles.searchInput)} qsc-search-input`}
          placeholder="Search documentation..."
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        <button
          className={styles.searchIcon}
          onClick={handleSearchSubmit}
          aria-label="Search"
          type="button"
        />
      </div>

      {isResultsVisible && suggestions.length > 0 && (
        <ul ref={resultsListRef} className={styles.searchSuggestions}>
          {suggestions.map((s, index) => (
            <li
              key={s.suggest}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRedirectToSearchPage(s.suggest);
              }}
              onMouseDown={() => handleSuggestionClick(s.suggest)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={clsx(styles.resultItem, {
                [styles.selectedItem]: index === selectedIndex,
              })}
              style={{ cursor: 'pointer' }} 
              tabIndex={0} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSuggestionClick(s.suggest);
                }
              }}
            >
              {highlightMatches(s.suggest)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}