document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start-read').addEventListener('click', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      browser.tabs.sendMessage(tab.id, { action: 'EXTRACT_ARTICLE' }).then((article) => {
        if (article) {
          browser.runtime.sendMessage({ action: 'OPEN_READER', article: article });
        } else {
          alert('Sayfa içeriği okunamadı.');
        }
      }).catch(() => {
        alert('Sayfa yenilenip tekrar denenmelidir.');
      });
    }
  });
});
