document.addEventListener('DOMContentLoaded', () => {
  const btnPdf = document.getElementById('btn-save-pdf');
  if (!btnPdf) return;

  btnPdf.addEventListener('click', () => {
    const userLang = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
    const isEn = userLang.startsWith('en');

    const headerTitle = isEn ? '📖 FocusRead Document Archive' : '📖 FocusRead Belge Arşivi';
    const today = new Date().toLocaleDateString(isEn ? 'en-US' : 'tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const headerDate = (isEn ? 'Archive Date: ' : 'Arşiv Tarihi: ') + today;

    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;

    const clonedContent = mainContainer.cloneNode(true);

    let printFrame = document.getElementById('fr-clean-print-frame');
    if (printFrame) printFrame.remove();

    printFrame = document.createElement('iframe');
    printFrame.id = 'fr-clean-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        ${styles}
        <link rel="stylesheet" href="pdf-print.css">
      </head>
      <body>
        <div class="pdf-page-wrapper">
          <div class="fr-print-header-ribbon">
            <div class="fr-print-header-left">
              <span class="fr-print-badge"></span>
              <span>${headerTitle}</span>
            </div>
            <div class="fr-print-header-right">
              ${headerDate}
            </div>
          </div>
          <div class="pdf-content-area">
            ${clonedContent.innerHTML}
          </div>
        </div>
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    }, 300);
  });
});
