import { dbConnect } from "../../../config/database.js";
import Vendor from "../../../models/vendor.model.js";

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    console.log(`[QR Bridge] Hit for slug: ${slug}`);
    
    await dbConnect();
    
    const vendor = await Vendor.findOne({ slug });
    
    if (!vendor) {
      console.warn(`[QR Bridge] Vendor not found for slug: ${slug}`);
      return new Response("Vendor not found", { status: 404 });
    }

    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.rhock.user"; 
    const appDeepLink = `rhock://vendor/${vendor._id}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Opening ${vendor.storeName}...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0;
            background-color: #f8fafc;
            color: #1e293b;
          }
          .container {
            text-align: center;
            padding: 2.5rem 2rem;
            background: white;
            border-radius: 1.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            max-width: 90%;
            width: 420px;
          }
          .loader { 
            border: 3px solid #f1f5f9; 
            border-top: 3px solid #3b82f6; 
            border-radius: 50%; 
            width: 48px; 
            height: 48px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 1.5rem; 
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; }
          p { color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
          .btn-group { display: flex; flex-direction: column; gap: 1rem; }
          .btn {
            display: block;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s ease;
            text-align: center;
          }
          .btn-primary { background-color: #3b82f6; color: white; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
          .btn-primary:hover { background-color: #2563eb; transform: translateY(-1px); }
          .btn-secondary { background-color: #f1f5f9; color: #475569; }
          .btn-secondary:hover { background-color: #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader" id="loader"></div>
          <h2>Opening ${vendor.storeName}</h2>
          <p>Scanning complete! We're redirecting you to ${vendor.storeName}'s profile in the Rhock app.</p>
          
          <div class="btn-group">
            <a href="${appDeepLink}" class="btn btn-primary">Open in App</a>
            <a href="${playStoreUrl}" class="btn btn-secondary">Download Rhock App</a>
          </div>
        </div>

        <script>
          const appDeepLink = "${appDeepLink}";
          const playStoreUrl = "${playStoreUrl}";
          
          function tryOpenApp() {
            window.location.href = appDeepLink;
            
            // Fallback after 4 seconds
            setTimeout(() => {
              if (!document.hidden) {
                window.location.href = playStoreUrl;
              }
            }, 4000);
          }

          // Initial attempt
          window.onload = tryOpenApp;

          // Re-attempt if user returns to page
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
               // If they are back, it means app didn't open or they came back from app
               document.getElementById('loader').style.display = 'none';
            }
          });
        </script>
      </body>
    </html>
  `;

    return new Response(html, {
      headers: { 
        "Content-Type": "text/html",
        "Cache-Control": "no-store, max-age=0"
      },
    });
  } catch (error) {
    console.error(`[QR Bridge Error]`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
