export default function (context, options) {
    return {
      name: '@quasiris/docusaurus-qsc-search',
      async contentLoaded({ actions }) {
        const { setGlobalData } = actions;
        setGlobalData({ suggestEndpoint: options.suggestEndpoint,apiEndpoint: options.apiEndpoint, resultKey: options.resultKey, searchParameters: options?.searchParameters || {}});
      },
    };
  }