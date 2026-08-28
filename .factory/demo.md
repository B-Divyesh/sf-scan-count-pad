# Demo sandbox

- URL: `https://scan-count-pad.sociobot.in/demo`
- Entry: select **Try it with sample data** on the first screen.
- Sample: four stockroom products, three existing counts, and one unresolved barcode.
- Reset: select **Reset demo** in the persistent demo banner.
- Exit: select **Start for real**. This clears the demo store and opens the real workspace.
- Isolation: demo data uses the IndexedDB database `demo:scan-count-pad`. Real data uses `scan-count-pad`; demo code never opens that database.

The demo contains no account, analytics, or network dependency. The service worker precaches the same application shell, so `/demo` remains usable offline after the first visit.
