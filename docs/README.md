# API Documentation

This directory contains the OpenAPI specification and Swagger UI for the Inbox Shore API.

## Viewing the Documentation

### Option 1: Using npx (Recommended)

1. From your project root, run:
   ```bash
   npx http-server docs -p 8080
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Option 2: Using a Global Installation

1. Install `http-server` globally (if you don't have it already):
   ```bash
   npm install -g http-server
   ```

2. Start the server:
   ```bash
   cd /path/to/inbox-shore-git/docs
   http-server -p 8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Troubleshooting

- If port 8080 is in use, try a different port (e.g., `-p 3002`)
- Ensure no other server is running on the same port
- Clear your browser cache if you don't see updates
- Check the terminal for any error messages

### Option 2: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

## Updating the Documentation

1. Edit the `openapi.yaml` file to update the API specification
2. The changes will be automatically reflected in the Swagger UI when you refresh the page

## Documentation Structure

- `openapi.yaml` - The OpenAPI 3.0 specification file
- `index.html` - The Swagger UI interface
- `README.md` - This file

## Notes

- The documentation is completely separate from the application code
- The API specification is based on the actual endpoints in your application
- You can use the "Try it out" feature in Swagger UI to test the API (when the server is running)
