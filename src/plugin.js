const path = require('path');

export default function (context, options) {
  return {
    name: '@quasiris/docusaurus-qsc-search',
    async contentLoaded({ actions, allContent }) {
      const { setGlobalData, addRoute } = actions;

      // Set global data as before
      setGlobalData({
        suggestEndpoint: options.suggestEndpoint,
        apiEndpoint: options.apiEndpoint,
        resultKey: options.resultKey,
        searchParameters: options?.searchParameters || {}
      });

      // Add the search results page route
      addRoute({
        // This is the path where your search page will be accessible
        path: '/search',
        // The component for your search results page
        component: path.join(__dirname, './SearchResultsPage'),
        // Pass the plugin's options as props to the component
        exact: true,
        props: {
          // You can pass the plugin options to the component if needed
          pluginOptions: options
        }
      });
    },
  };
}