document.addEventListener('DOMContentLoaded', async () => {
  const api = typeof browser !== 'undefined' ? browser : chrome;

  // Sistem dil tespiti
  const userLang = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
  const isEn = userLang.startsWith('en');

  const dict = {
    btnAi: isEn ? '🤖 AI Summary' : '🤖 Yapay Zeka Özeti',
    btnDark: isEn ? '🌙 Dark Mode' : '🌙 Gece Modu',
    btnWa: isEn ? '💬 WhatsApp' : '💬 WhatsApp',
    btnPdf: isEn ? '📄 PDF / Download' : '📄 PDF / İndir',
    aiModalTitle: isEn ? '✨ AI Content Summary' : '✨ Yapay Zeka İçerik Özeti',
    aiAnalyzing: isEn ? 'AI is analyzing the article, please wait...' : 'Yapay zeka içeriği analiz ediyor, lütfen bekleyin...',
    aiNoText: isEn ? 'Not enough text found to generate a summary.' : 'Özet çıkarılacak yeterli metin bulunamadı.',
    copyrightLabel: isEn ? 'Original Source URL:' : 'Orijinal Kaynak URL:',
    copyrightNote: isEn ? '* This content was compiled with FocusRead personal assistant for research and archiving.' : '* Bu içerik FocusRead kişisel okuma asistanı ile bilgi ve kişisel arşiv amacıyla derlenmiştir.',
    penYellow: isEn ? 'Yellow Highlighter' : 'Sarı Kalem',
    penGreen: isEn ? 'Green Highlighter' : 'Yeşil Kalem',
    penBlue: isEn ? 'Blue Highlighter' : 'Mavi Kalem',
    penPink: isEn ? 'Pink Highlighter' : 'Pembe Kalem'
  };

  // Metinleri Güncelle
  document.getElementById('btn-ai-summarize').innerText = dict.btnAi;
  document.getElementById('btn-toggle-dark').innerText = dict.btnDark;
  document.getElementById('btn-share-wa').innerText = dict.btnWa;
  document.getElementById('btn-save-pdf').innerText = dict.btnPdf;
  document.getElementById('ai-modal-title').innerText = dict.aiModalTitle;

  document.getElementById('pen-yellow').title = dict.penYellow;
  document.getElementById('pen-green').title = dict.penGreen;
  document.getElementById('pen-blue').title = dict.penBlue;
  document.getElementById('pen-pink').title = dict.penPink;

  const titleEl = document.getElementById('article-title');
  const copyrightEl = document.getElementById('article-copyright');
  const contentEl = document.getElementById('article-content');
  const palette = document.getElementById('highlight-palette');
  
  const aiModal = document.getElementById('ai-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const aiText = document.getElementById('ai-summary-text');

  let currentFontSize = 20;
  let originalUrl = '';
  let articleKey = '';
  let activeRange = null;

  // 1. İÇERİĞİ YÜKLE
  const stored = await api.storage.local.get('fr_current_article');
  if (stored && stored.fr_current_article) {
    const art = stored.fr_current_article;
    titleEl.innerText = art.title;
    originalUrl = art.url || '';
    articleKey = 'fr_saved_' + encodeURIComponent(originalUrl);
    document.title = art.title + " - FocusRead";

    copyrightEl.innerHTML = `<strong>${dict.copyrightLabel}</strong> <a href="${originalUrl}" target="_blank" style="color:#0284c7;">${originalUrl}</a><br/><span style="font-size:11px; opacity:0.8;">${dict.copyrightNote}</span>`;

    const saved = await api.storage.local.get(articleKey);
    if (saved && saved[articleKey]) {
      contentEl.innerHTML = saved[articleKey];
    } else {
      contentEl.innerHTML = art.content;
    }
  } else {
    titleEl.innerText = "FocusRead";
  }

  // 2. YÜZEN KALEM PALETİ
  document.addEventListener('mouseup', (e) => {
    if (palette.contains(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect.width > 0) {
          activeRange = range.cloneRange();
          palette.style.display = 'flex';
          palette.style.top = `${rect.top + window.scrollY - 45}px`;
          palette.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 60}px`;
        }
      } else {
        palette.style.display = 'none';
      }
    }, 20);
  });

  // 3. KALEM RENKLENDİRME MOTORU
  document.querySelectorAll('.pen-dot').forEach(dot => {
    dot.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const colorClass = dot.dataset.color;
      
      const selection = window.getSelection();
      let rangeToUse = null;

      if (selection && !selection.isCollapsed) {
        rangeToUse = selection.getRangeAt(0);
      } else if (activeRange) {
        rangeToUse = activeRange;
      }

      if (rangeToUse) {
        highlightRange(rangeToUse, colorClass);
        if (selection) selection.removeAllRanges();
        activeRange = null;
        saveArticleState();
      }

      palette.style.display = 'none';
    });
  });

  function highlightRange(range, colorClass) {
    try {
      const mark = document.createElement('mark');
      mark.className = colorClass;
      
      if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
        range.surroundContents(mark);
      } else {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
    } catch (err) {
      document.execCommand('hiliteColor', false, getHexFromClass(colorClass));
    }
  }

  function getHexFromClass(className) {
    switch (className) {
      case 'fr-hl-yellow': return '#fef08a';
      case 'fr-hl-green': return '#bbf7d0';
      case 'fr-hl-blue': return '#bae6fd';
      case 'fr-hl-pink': return '#fbcfe8';
      default: return '#fef08a';
    }
  }

  function saveArticleState() {
    if (!articleKey) return;
    const data = {};
    data[articleKey] = contentEl.innerHTML;
    api.storage.local.set(data);
  }

  // 4. AÇILIR MODAL PENCEREDE YAPAY ZEKA ÖZETİ
  document.getElementById('btn-ai-summarize').addEventListener('click', () => {
    aiModal.style.display = 'flex';
    aiText.innerHTML = `<em>${dict.aiAnalyzing}</em>`;

    setTimeout(() => {
      const pElements = contentEl.querySelectorAll('p, .fr-p-node');
      let textList = [];

      pElements.forEach(p => {
        const txt = p.innerText.trim();
        if (txt.length > 25) {
          textList.push(txt);
        }
      });

      if (textList.length === 0) {
        aiText.innerText = dict.aiNoText;
        return;
      }

      const selectedPars = textList.slice(0, 5);
      const summaryHTML = selectedPars.map((p, index) => 
        `<div style="margin-bottom: 12px;"><strong>${index + 1}.</strong> ${p}</div>`
      ).join('');

      aiText.innerHTML = summaryHTML;
    }, 300);
  });

  modalCloseBtn.addEventListener('click', () => {
    aiModal.style.display = 'none';
  });

  aiModal.addEventListener('click', (e) => {
    if (e.target === aiModal) {
      aiModal.style.display = 'none';
    }
  });

  // 5. YAZI BOYUTU VE TEMA
  document.getElementById('btn-font-plus').addEventListener('click', () => {
    if (currentFontSize < 36) {
      currentFontSize += 2;
      contentEl.querySelectorAll('p').forEach(p => p.style.fontSize = currentFontSize + 'px');
    }
  });

  document.getElementById('btn-font-minus').addEventListener('click', () => {
    if (currentFontSize > 14) {
      currentFontSize -= 2;
      contentEl.querySelectorAll('p').forEach(p => p.style.fontSize = currentFontSize + 'px');
    }
  });

  document.getElementById('btn-toggle-dark').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
  });

  // 6. PAYLAŞIM VE PDF
  document.getElementById('btn-share-wa').addEventListener('click', () => {
    const text = encodeURIComponent(`" ${titleEl.innerText} "\n\n${originalUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  });

  document.getElementById('btn-save-pdf').addEventListener('click', () => {
    window.print();
  });
});
