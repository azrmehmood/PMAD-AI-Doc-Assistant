
# PMAD AI Document Assistant - Local Deployment

This application allows users to upload multiple PDF files and query them using the Gemini 3 Flash model.

## Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key

## Local Setup

1. **Clone/Download** the project files into a folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configuration**:
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_actual_gemini_api_key
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Production Deployment (On-Premise)

### Using Docker
1. **Build the image**:
   ```bash
   docker build -t pmad-ai .
   ```
2. **Run the container**:
   ```bash
   docker run -d -p 8080:80 --name pmad-assistant pmad-ai
   ```

### Manual Nginx Deployment
1. Run `npm run build`.
2. Copy the contents of the `dist/` folder to your web server's root directory (e.g., `/var/www/html`).
3. Ensure your server is configured to serve `index.html` for all routes if you add navigation.

## Security Note
This application runs entirely in the client's browser. When deploying locally, ensure your `API_KEY` is handled securely. For internal corporate use, consider adding an authentication layer (like OIDC or Basic Auth) via your Nginx reverse proxy.
