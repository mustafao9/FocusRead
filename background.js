browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_READER') {
    browser.storage.local.set({ fr_current_article: message.article }).then(() => {
      browser.tabs.create({ url: browser.runtime.getURL('reader.html') });
    });
  }
});
