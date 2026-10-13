document.addEventListener('DOMContentLoaded', async () => {
  const api = typeof browser !== 'undefined' ? browser : chrome;

  const userLang = (navigator.language || navigator.userLanguage || 'tr').toLowerCase();
  const isEn = userLang.startsWith('en');

  const dict = {
    btnAi: isEn ? '🤖 AI Summary' : '🤖 Yapay Zeka Özeti',
    btnDark: isEn ? '🌙 Dark Mode' : '🌙 Gece Modu',
    btnAbout: isEn ? 'ℹ️ About Us' : 'ℹ️ Hakkımızda',
    btnSupport: isEn ? '☕ Support Us' : '☕ Destek Ol',
    btnPdf: isEn ? '📄 PDF / Download' : '📄 PDF / İndir',
    aiModalTitle: isEn ? '✨ AI Content Summary' : '✨ Yapay Zeka İçerik Özeti',
    aiAnalyzing: isEn ? 'AI is analyzing the article, please wait...' : 'Yapay zeka içeriği analiz ediyor, lütfen bekleyin...',
    aiNoText: isEn ? 'Not enough text found to generate a summary.' : 'Özet çıkarılacak yeterli metin bulunamadı.',
    aboutModalTitle: isEn ? 'ℹ️ About FocusRead' : 'ℹ️ Hakkımızda — FocusRead',
    copyrightLabel: isEn ? 'Original Source URL:' : 'Orijinal Kaynak URL:',
    copyrightNote: isEn ? '* This content was compiled with FocusRead personal assistant for research and archiving.' : '* Bu içerik FocusRead kişisel okuma asistanı ile bilgi ve kişisel arşiv amacıyla derlenmiştir.',
    aboutBodyHTML: isEn ? `
      <p>Reading news, articles, or research online has become frustrating due to intrusive ads, pop-ups, clutter, and endless distractions that ruin the reading experience.</p>
      <p><strong>FocusRead</strong> is an independent personal reading assistant created to clear away digital noise and make the web reader-friendly again.</p>
      <h4 style="color:#0284c7; margin-top:14px; margin-bottom:6px;">Our Privacy & Security Promise:</h4>
      <ul>
        <li><strong>Zero Access to Personal Data:</strong> We do not track, collect, or store your browsing history, personal details, or online activity.</li>
        <li><strong>No Hidden Backdoors:</strong> Our extension sends no data to external servers. There are absolutely no hidden background processes or data tracking mechanisms.</li>
        <li><strong>100% Local Processing:</strong> Everything runs completely locally within your own browser and device.</li>
      </ul>
      <h4 style="color:#0284c7; margin-top:14px; margin-bottom:6px;">Why We Built It:</h4>
      <ul>
        <li><strong>Eliminating Web Clutter:</strong> Focus strictly on the main content and images.</li>
        <li><strong>Simplifying Your Life:</strong> Dark mode, font sizing (A+/A-), color highlighting, and clean framed PDF downloads.</li>
        <li><strong>A Freer Reading Experience:</strong> Distraction-free access to information.</li>
      </ul>
    ` : `
      <p>İnternette bir haber, araştırma veya makale okurken sürekli karşımıza çıkan reklamlar, açılır pencereler, göz yoran renkler ve dikkat dağıtan kalabalık zamanla okuma keyfini yok ediyor.</p>
      <p><strong>FocusRead</strong>, dijital gürültüyü temizlemek ve interneti yeniden okur dostu kılmak için geliştirilmiş bağımsız bir kişisel okuma asistanıdır.</p>
      <h4 style="color:#0284c7; margin-top:14px; margin-bottom:6px;">Gizlilik ve Güvenlik Sözümüz (Verileriniz Sadece Sizindir):</h4>
      <ul>
        <li><strong>Kişisel Verilerinize Ulaşmıyoruz:</strong> Okuma geçmişiniz, kişisel bilgileriniz veya tarayıcı hareketleriniz asla izlenmez, toplanmaz ve kaydedilmez.</li>
        <li><strong>Arka Planda Gizli Kapı Yok:</strong> Eklentimiz dışarıdaki hiçbir sunucuya veri aktarmaz; arka planda çalışan gizli bir kod veya veri toplama mekanizması kesinlikle yoktur.</li>
        <li><strong>%100 Yerel Çalışma:</strong> Tüm işlemler tamamen kendi cihazınızda ve tarayıcınızın içinde gerçekleşir.</li>
      </ul>
      <h4 style="color:#0284c7; margin-top:14px; margin-bottom:6px;">Neden Yaptık? (Daha Özgür Bir İnternet İçin):</h4>
      <ul>
        <li><strong>Gereksiz Kirliliği Temizlemek:</strong> Sadece ana içeriğe ve görsellere odaklanmanızı sağlıyoruz.</li>
        <li><strong>Hayatınızı Kolaylaştırmak:</strong> Gece modu, punto ayarlama (A+/A-), renkli işaretleme ve dergi/arşiv kalitesinde çerçeveli PDF indirme imkânı sunuyoruz.</li>
        <li><strong>Özgür Okuma Deneyimi:</strong> Bilgiye hızlı, engelsiz ve gözü yormadan ulaşmanın herkesin hakkı olduğuna inanıyoruz.</li>
      </ul>
    `
  };

  const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
  setTxt('btn-ai-summarize', dict.btnAi);
  setTxt('btn-toggle-dark', dict.btnDark);
  setTxt('btn-about', dict.btnAbout);
  setTxt('btn-support', dict.btnSupport);
  setTxt('btn-save-pdf', dict.btnPdf);
  setTxt('ai-modal-title', dict.aiModalTitle);
  setTxt('about-modal-title', dict.aboutModalTitle);

  const aboutBody = document.getElementById('about-modal-body');
  if (aboutBody) aboutBody.innerHTML = dict.aboutBodyHTML;

  const titleEl = document.getElementById('article-title');
  const copyrightEl = document.getElementById('article-copyright');
  const contentEl = document.getElementById('article-content');
  const palette = document.getElementById('highlight-palette');

  let currentFontSize = 20;
  let originalUrl = '';
  let articleKey = '';
  let activeRange = null;

  // İÇERİĞİ YÜKLE
  const stored = await api.storage.local.get('fr_current_article');
  if (stored && stored.fr_current_article) {
    const art = stored.fr_current_article;
    if (titleEl) titleEl.innerText = art.title;
    originalUrl = art.url || '';
    articleKey = 'fr_saved_' + encodeURIComponent(originalUrl);
    document.title = art.title + " - FocusRead";

    if (copyrightEl) {
      copyrightEl.innerHTML = `<strong>${dict.copyrightLabel}</strong> <a href="${originalUrl}" target="_blank" style="color:#0284c7;">${originalUrl}</a><br/><span style="font-size:11px; opacity:0.8;">${dict.copyrightNote}</span>`;
    }

    const saved = await api.storage.local.get(articleKey);
    if (contentEl) {
      contentEl.innerHTML = (saved && saved[articleKey]) ? saved[articleKey] : art.content;
    }
  }

  // AI MODAL
  const btnAi = document.getElementById('btn-ai-summarize');
  const aiModal = document.getElementById('ai-modal');
  const aiClose = document.getElementById('ai-modal-close');
  const aiText = document.getElementById('ai-summary-text');

  if (btnAi) {
    btnAi.addEventListener('click', () => {
      if (aiModal) aiModal.style.display = 'flex';
      if (aiText) aiText.innerHTML = `<em>${dict.aiAnalyzing}</em>`;

      setTimeout(() => {
        if (!contentEl) return;
        const paragraphs = Array.from(contentEl.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 30);
        if (paragraphs.length === 0) {
          if (aiText) aiText.innerText = dict.aiNoText;
          return;
        }
        const summaryCount = Math.min(4, paragraphs.length);
        const selected = paragraphs.slice(0, summaryCount);
        const summaryHTML = selected.map((p, idx) => `<p style="margin-bottom:10px;"><strong>${idx + 1}.</strong> ${p}</p>`).join('');
        if (aiText) aiText.innerHTML = summaryHTML;
      }, 300);
    });
  }

  if (aiClose) aiClose.addEventListener('click', () => { if (aiModal) aiModal.style.display = 'none'; });

  // HAKKIMIZDA & DESTEK
  const btnAbout = document.getElementById('btn-about');
  const aboutModal = document.getElementById('about-modal');
  const aboutClose = document.getElementById('about-modal-close');

  if (btnAbout) btnAbout.addEventListener('click', () => { if (aboutModal) aboutModal.style.display = 'flex'; });
  if (aboutClose) aboutClose.addEventListener('click', () => { if (aboutModal) aboutModal.style.display = 'none'; });

  const btnSupport = document.getElementById('btn-support');
  if (btnSupport) {
    btnSupport.addEventListener('click', () => { window.open('https://buymeacoffee.com/mustafasatilmis', '_blank'); });
  }

  // PUNTO AYARI
  const btnPlus = document.getElementById('btn-font-plus');
  const btnMinus = document.getElementById('btn-font-minus');

  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      if (currentFontSize < 36 && contentEl) {
        currentFontSize += 2;
        contentEl.querySelectorAll('p').forEach(p => p.style.fontSize = currentFontSize + 'px');
      }
    });
  }

  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      if (currentFontSize > 12 && contentEl) {
        currentFontSize -= 2;
        contentEl.querySelectorAll('p').forEach(p => p.style.fontSize = currentFontSize + 'px');
      }
    });
  }

  // MARKER
  document.addEventListener('mouseup', (e) => {
    if (palette && palette.contains(e.target)) return;
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && palette) {
          activeRange = range.cloneRange();
          palette.style.display = 'flex';
          palette.style.top = `${rect.top + window.scrollY - 45}px`;
          palette.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 60}px`;
        }
      } else {
        if (palette) palette.style.display = 'none';
      }
    }, 20);
  });

  document.querySelectorAll('.pen-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const colorClass = dot.dataset.color;
      const selection = window.getSelection();
      let rangeToUse = (selection && !selection.isCollapsed) ? selection.getRangeAt(0) : activeRange;

      if (rangeToUse) {
        try {
          const mark = document.createElement('mark');
          mark.className = colorClass;
          mark.appendChild(rangeToUse.extractContents());
          rangeToUse.insertNode(mark);
        } catch (err) {}
        if (selection) selection.removeAllRanges();
        activeRange = null;
      }
      if (palette) palette.style.display = 'none';
    });
  });

  const btnDark = document.getElementById('btn-toggle-dark');
  if (btnDark) btnDark.addEventListener('click', () => document.body.classList.toggle('dark-theme'));
});
