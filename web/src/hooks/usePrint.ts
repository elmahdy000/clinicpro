export const usePrint = () => {
  const printElement = (elementId: string, title: string = 'Print Document') => {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Element with id ${elementId} not found.`);
      return;
    }

    // Use a hidden iframe to isolate the print content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      console.error('Could not access iframe document');
      return;
    }

    // Clone all page stylesheets to ensure Tailwind and custom styles work
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((s) => s.outerHTML)
      .join('\n');

    // Create the isolated print HTML
    const html = `
      <!DOCTYPE html>
      <html dir="${document.dir || 'rtl'}">
      <head>
        <title>${title}</title>
        ${styles}
        <style>
          @media print {
            @page { size: A4; margin: 12mm; }
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .no-print { display: none !important; }
            /* Force the container to take full width and remove scrollbars */
            html, body {
              width: 100%;
              height: auto;
              overflow: visible !important;
            }
          }
          body { font-family: inherit; background: white; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${el.outerHTML}
        <script>
          window.onload = () => {
            // Give styles time to apply before printing
            setTimeout(() => {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Clean up the iframe after printing is done or canceled
    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 500);
    };

    if (iframe.contentWindow) {
      iframe.contentWindow.addEventListener('afterprint', cleanup);
      // Fallback cleanup if afterprint doesn't fire
      setTimeout(cleanup, 60000); 
    }
  };

  return { printElement };
};
