export default function (context, options) {
    return {
      name: '@quasiris/docusaurus-qsc-search',
      async contentLoaded({ actions }) {
        const { setGlobalData } = actions;
        setGlobalData({ apiEndpoint: options.apiEndpoint, apiKey: options.apiKey, searchParameters: options?.searchParameters || {}});
      },
    };
  }