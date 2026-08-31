# denue-mcp

An MCP (Model Context Protocol) server that gives Claude and other AI agents direct access to **DENUE**, INEGI's National Statistical Directory of Economic Units — over 5 million businesses and establishments across all of Mexico.

## Why

DENUE is one of the richest open datasets in Mexico (identity, location, economic activity and size for millions of establishments), but using it means learning INEGI's REST API by hand. This server exposes it as four tools any MCP-compatible agent can call directly, so you can ask things like *"find hardware stores within 1km of these coordinates in Guadalajara"* or *"list bakeries registered in Oaxaca"* in plain language.

Existing MCP integrations with DENUE (e.g. `cdmx-mcp`) bundle it as one of several Mexico City-only datasets. This one is scoped specifically to DENUE, at national level — any of the 32 states, or the whole country at once.

## Tools

| Tool | What it does |
|---|---|
| `denue_buscar_cercania` | Search businesses by keyword near a lat/long coordinate (radius up to 5km) |
| `denue_buscar_por_estado` | Search businesses by keyword within a specific state, or nationwide |
| `denue_buscar_por_nombre` | Search businesses by commercial or legal name |
| `denue_detalle` | Get the full record for a specific establishment by its DENUE id |

State names are accepted in plain Spanish ("Jalisco", "Ciudad de Mexico") — no need to know INEGI's numeric codes.

## Setup

1. **Get a free DENUE API token** — register at [inegi.org.mx/servicios/api_denue.html](https://www.inegi.org.mx/servicios/api_denue.html).
2. Clone and build:
   ```bash
   git clone https://github.com/mxnueel/denue-mcp.git
   cd denue-mcp
   npm install
   npm run build
   ```
3. Add it to your MCP client config (e.g. `claude_desktop_config.json` or Claude Code's `.mcp.json`):
   ```json
   {
     "mcpServers": {
       "denue": {
         "command": "node",
         "args": ["/absolute/path/to/denue-mcp/build/index.js"],
         "env": { "INEGI_DENUE_TOKEN": "your-token-here" }
       }
     }
   }
   ```

## Status

Core MCP protocol flow (initialize, tool listing, tool invocation, error handling) is implemented and tested. The exact request/response shape against INEGI's live API is pending end-to-end verification with a real token (INEGI's endpoint blocks unauthenticated/scripted probing, so this needs a registered token to confirm) — if you hit a parsing issue, please open an issue with the raw error.

## License

MIT
