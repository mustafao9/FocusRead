(function() {
  'use strict';

  const userLang = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
  const isEn = userLang.startsWith('en');

  const dict = {
    bannerText: isEn ? '📖 Read this article with <strong>FocusRead</strong>' : '📖 Bu içeriği <strong>FocusRead</strong> ile oku',
    bannerBtn: isEn ? 'Read with FocusRead' : 'FocusRead ile Oku'
  };

  function parsePageArticle() {
    const title = document.title || 'İçerik Başlığı';
    
    let leadImageUrl = '';
    const ogImageMeta = document.querySelector('meta[property="og:image"], meta[name="twitter:image"]');
    if (ogImageMeta && ogImageMeta.content) {
      leadImageUrl = ogImageMeta.content;
    }

    let primaryArticle = document.querySelector(
      '[itemprop="articleBody"], .news-content, .rhd-all-article-data, .article__content, .reading-inner, article .content-body'
    );

    if (!primaryArticle) {
      const allArticles = document.querySelectorAll('article, .news-detail');
      primaryArticle = allArticles.length > 0 ? allArticles[0] : document.body;
    }

    const elements = Array.from(primaryArticle.querySelectorAll('p, h1, h2, h3, img'));
    let cleanContentHTML = '';
    let paragraphCount = 0;

    if (leadImageUrl && !leadImageUrl.toLowerCase().includes('logo') && !leadImageUrl.toLowerCase().includes('default')) {
      cleanContentHTML += `<div style="text-align:center; margin:5px 0 10px 0;"><img src="${leadImageUrl}" style="max-width:100%; max-height:260px; width:auto; height:auto; border-radius:8px;" /></div>`;
    }

    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    const rightColumnThreshold = screenWidth * 0.65;

    for (let el of elements) {
      const parentBlock = el.closest(
        '[class*="reklam"], [id*="reklam"], [class*="banner"], [id*="banner"], ' +
        '[class*="sponsor"], [class*="widget"], [class*="sidebar"], [class*="aside"], ' +
        '[class*="right"], [class*="promo"], [class*="outbrain"], [class*="taboola"], ' +
        '[class*="related"], [class*="bakmadan"], [class*="recommend"], [class*="popular"], ' +
        '[class*="google"], [class*="follow"], [class*="takip"], [class*="social"]'
      );
      
      if (parentBlock) continue;

      const tagName = el.tagName.toLowerCase();

      if ((tagName === 'h1' || tagName === 'h2') && paragraphCount >= 3) {
        break;
      }

      if (tagName === 'img') {
        const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
        const alt = (el.getAttribute('alt') || '').toLowerCase();
        const lowerSrc = src.toLowerCase();

        if (leadImageUrl && src === leadImageUrl) continue;

        const rect = el.getBoundingClientRect();
        if (rect.left > rightColumnThreshold && rect.width > 0) continue;
        if (rect.width > 0 && rect.width < 180) continue;

        const isAdOrIcon = lowerSrc.includes('appstore') || 
                           lowerSrc.includes('googleplay') || 
                           lowerSrc.includes('google') || 
                           lowerSrc.includes('banner') || 
                           lowerSrc.includes('reklam') || 
                           lowerSrc.includes('store') ||
                           lowerSrc.includes('icon') ||
                           lowerSrc.includes('logo') ||
                           lowerSrc.includes('follow') ||
                           lowerSrc.includes('takip') ||
                           alt.includes('reklam') ||
                           alt.includes('google') ||
                           alt.includes('takip');

        if (src && !isAdOrIcon) {
          cleanContentHTML += `<div style="text-align:center; margin:10px 0;"><img src="${src}" style="max-width:100%; max-height:260px; width:auto; height:auto; border-radius:8px;" /></div>`;
        }
      } else {
        const text = el.textContent.trim();
        const lowerText = text.toLowerCase();

        const isAdText = lowerText.includes('cookie') || 
                         lowerText.includes('çerez') || 
                         lowerText.includes('abone ol') || 
                         lowerText.includes('tıklayın') || 
                         lowerText.includes('sponsorlu') ||
                         lowerText.includes('google’da takip') ||
                         lowerText.includes('reklam');

        if (text.length > 30 && !isAdText) {
          cleanContentHTML += `<p class="fr-p-node">${text}</p>`;
          paragraphCount++;
        }
      }
    }

    if (!cleanContentHTML) {
      cleanContentHTML = `<p class="fr-p-node">${document.body.innerText.substring(0, 3000)}...</p>`;
    }

    return {
      title: title,
      content: cleanContentHTML,
      url: window.location.href
    };
  }

  function showNotificationBanner() {
    const textLength = document.body.innerText.length;
    const pCount = document.querySelectorAll('p').length;

    if (textLength > 500 && pCount >= 2) {
      if (document.getElementById('focusread-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'focusread-banner';
      banner.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999999;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        padding: 12px 18px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(2, 132, 199, 0.4);
        max-width: fit-content;
      `;

      banner.innerHTML = `
        <span style="white-space: nowrap;">${dict.bannerText}</span>
        <button id="focusread-btn-read" style="background:#0284c7; color:#fff; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px; white-space: nowrap; transition: background 0.2s;">${dict.bannerBtn}</button>
        <span id="focusread-btn-close" style="cursor:pointer; color:#94a3b8; font-size:15px; margin-left:4px;">✕</span>
      `;

      document.body.appendChild(banner);

      const readBtn = document.getElementById('focusread-btn-read');
      readBtn.addEventListener('mouseenter', () => readBtn.style.background = '#0369a1');
      readBtn.addEventListener('mouseleave', () => readBtn.style.background = '#0284c7');

      const api = typeof browser !== 'undefined' ? browser : chrome;
      readBtn.addEventListener('click', () => {
        const articleData = parsePageArticle();
        api.runtime.sendMessage({ action: 'OPEN_READER', article: articleData });
        banner.remove();
      });

      document.getElementById('focusread-btn-close').addEventListener('click', () => {
        banner.remove();
      });
    }
  }

  const api = typeof browser !== 'undefined' ? browser : chrome;
  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'EXTRACT_ARTICLE') {
        sendResponse(parsePageArticle());
      }
    });
  }

  setTimeout(showNotificationBanner, 1000);
})();
