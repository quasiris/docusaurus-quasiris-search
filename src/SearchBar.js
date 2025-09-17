import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';
import styles from './custom.module.css';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export default function SearchBar({ suggestEndpoint, apiEndpoint, resultKey, searchParameters = {},resultPage=false }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const resultsListRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);

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
    if (debouncedQuery.trim().length > 1) {
      const fetchSuggestions = async () => {
        try {
          const params = new URLSearchParams({ q: debouncedQuery, ...searchParameters });
          const response = await fetch(`${suggestEndpoint}?${params.toString()}`);
          const data = await response.json();
          const newSuggestions = Array.isArray(data) ? data : [];
          setSuggestions(newSuggestions);
          setSelectedIndex(-1); // Always reset to -1 when suggestions change
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
  }, [debouncedQuery, suggestEndpoint, searchParameters, inputFocused]);

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

  const handleSearch = (e) => setQuery(e.target.value);

  const handleRedirect = (url) => {
    if (ExecutionEnvironment.canUseDOM) {
      window.location.href = url;
    }
  };

  const handleRedirectToSearchPage = (q) => {
    if (ExecutionEnvironment.canUseDOM) {
      window.location.href = `/search?query=${encodeURIComponent(q)}`;
    }
  };

  const handleSuggestionRedirect = async (suggestText) => {
    try {
      const params = new URLSearchParams({ q: suggestText, ...searchParameters });
      const response = await fetch(`${apiEndpoint}?${params.toString()}`);
      const data = await response.json();
      const documents = data?.result?.[resultKey]?.documents || [];
      if (documents.length > 0) {
        handleRedirect(documents[0].document.url);
      } else {
        handleRedirectToSearchPage(suggestText);
      }
    } catch (error) {
      console.error('Error fetching document url for suggestion:', error);
      handleRedirectToSearchPage(suggestText);
    }
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
      // user selected a suggestion → resolve its first doc url
      handleSuggestionRedirect(suggestions[selectedIndex].suggest);
    } else {
      // no suggestion selected → just go to /search page
      handleRedirectToSearchPage(query);
    }
  };

  const handleKeyDown = (e) => {
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
        case 'Enter':
          e.preventDefault();
          handleSearchSubmit();
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
          onBlur={() => setInputFocused(false)}
        />
        <button
          className={styles.searchIcon}
          onClick={handleSearchSubmit}
          aria-label="Search"
          type="button"
        />
      </div>

      {isResultsVisible && suggestions.length > 0 && (
        <ul ref={resultsListRef} className={styles.searchResults}>
          {suggestions.map((s, index) => (
            <li
              key={s.suggest}
              onClick={() => handleSuggestionRedirect(s.suggest)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={clsx(styles.resultItem, {
                [styles.selectedItem]: index === selectedIndex,
              })}
              style={{ cursor: 'pointer' }} 
              tabIndex={0} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuggestionRedirect(s.suggest);
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
