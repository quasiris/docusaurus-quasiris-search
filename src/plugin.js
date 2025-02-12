export default function (context, options) {
    return {
      name: 'docusaurus-quasiris-search',
      async contentLoaded({ actions }) {
        const { setGlobalData } = actions;
        setGlobalData({ apiEndpoint: options.apiEndpoint,indexName: options.indexName, });
      },
    };
  }