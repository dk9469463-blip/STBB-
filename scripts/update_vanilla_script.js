import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('src/data/officialStbbCatalog.json', 'utf8'));

const js = `/**
 * STBB Books by Ajeet Kumar Oad
 * Standalone Vanilla JavaScript - Verified with ebooks.stbb.edu.pk
 * Features: PDF.js In-App Canvas Reader + Direct Blob Download (No Extra Tab)
 */

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const OFFICIAL_STBB_SOURCE = 'https://ebooks.stbb.edu.pk/';

const CLASSES_DATA = [
  { number: 1, title: 'Class 1', level: 'Primary', desc: 'Foundational literacy, numeracy & early learning.' },
  { number: 2, title: 'Class 2', level: 'Primary', desc: 'Basic concepts in languages, math & nature.' },
  { number: 3, title: 'Class 3', level: 'Primary', desc: 'General Science, Social Studies, Math & Languages.' },
  { number: 4, title: 'Class 4', level: 'Primary', desc: 'Intermediate primary reasoning, science & history.' },
  { number: 5, title: 'Class 5', level: 'Primary', desc: 'Primary board preparation & comprehensive curriculum.' },
  { number: 6, title: 'Class 6', level: 'Middle', desc: 'Middle transition: Computer Education, Science & Math.' },
  { number: 7, title: 'Class 7', level: 'Middle', desc: 'Scientific exploration, mathematics & history.' },
  { number: 8, title: 'Class 8', level: 'Middle', desc: 'Middle school capstone preparing for Secondary (Matric).' },
  { number: 9, title: 'Class 9', level: 'Secondary (Matric)', desc: 'BSEK / BISE syllabus: Biology, Physics, Chemistry, Computer, Math.' },
  { number: 10, title: 'Class 10', level: 'Secondary (Matric)', desc: 'Matriculation Board Examination year (SSC Part 2).' },
  { number: 11, title: 'Class 11', level: 'Higher Secondary', desc: 'Intermediate Part 1: Pre-Medical, Pre-Engineering, ICS, Commerce.' },
  { number: 12, title: 'Class 12', level: 'Higher Secondary', desc: 'Intermediate Part 2: College graduation curriculum.' }
];

const BOOKS_DATA = ${JSON.stringify(catalog, null, 2)};

let currentTab = 'home';
let currentSelectedClass = null;

// PDF.js Viewer State
let currentPdfDoc = null;
let currentPdfPage = 1;
let currentPdfScale = 1.2;
let activeViewingBook = null;

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderClasses();
  setupSearch();
  setupModal();

  const savedClass = localStorage.getItem('stbb_last_class');
  if (savedClass) {
    const classNum = parseInt(savedClass, 10);
    const resumeBtn = document.getElementById('resume-class-btn');
    if (resumeBtn) {
      resumeBtn.style.display = 'inline-block';
      resumeBtn.textContent = 'Resume Class ' + classNum;
      resumeBtn.onclick = () => selectClass(classNum);
    }
  }
});

function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  const exploreBtn = document.getElementById('explore-classes-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => switchTab('classes'));
  }
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector('[data-tab="' + tab + '"]');
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');

  if (tab === 'home') {
    document.getElementById('home-view').style.display = 'block';
  } else if (tab === 'classes') {
    document.getElementById('classes-view').style.display = 'block';
    renderClasses();
  } else if (tab === 'search') {
    document.getElementById('search-view').style.display = 'block';
    performSearch();
  } else if (tab === 'about') {
    document.getElementById('about-view').style.display = 'block';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderClasses() {
  const container = document.getElementById('classes-container');
  if (!container) return;

  container.innerHTML = '';
  CLASSES_DATA.forEach(cls => {
    const classBooks = BOOKS_DATA.filter(b => b.classNumber === cls.number);
    const card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML = \`
      <div>
        <div class="class-card-header">
          <div class="class-badge">\${cls.number}</div>
          <span class="tier-tag">\${cls.level}</span>
        </div>
        <h3>\${cls.title}</h3>
        <p>\${cls.desc}</p>
        <span style="font-size: 0.75rem; color: #1e40af; font-weight: 700;">\${classBooks.length} Verified Books</span>
      </div>
      <div class="class-card-footer">
        <span>View Textbooks</span>
        <span>→</span>
      </div>
    \`;
    card.onclick = () => selectClass(cls.number);
    container.appendChild(card);
  });
}

function selectClass(classNumber) {
  currentSelectedClass = classNumber;
  localStorage.setItem('stbb_last_class', classNumber);

  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
  const subjectView = document.getElementById('subjects-view');
  subjectView.style.display = 'block';

  const classBooks = BOOKS_DATA.filter(b => b.classNumber === classNumber);
  document.getElementById('selected-class-title').textContent = 'Class ' + classNumber + ' Textbooks (' + classBooks.length + ' Books)';

  const booksContainer = document.getElementById('class-books-container');
  booksContainer.innerHTML = '';

  if (classBooks.length === 0) {
    booksContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">Book PDF is not available yet.</p>';
    return;
  }

  classBooks.forEach(book => {
    booksContainer.appendChild(createBookCard(book));
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';

  card.innerHTML = \`
    <div class="book-cover" style="position: relative; height: 260px; padding: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      \${book.coverUrl ? \`
        <img src="\${book.coverUrl}" alt="\${book.title}" style="max-height: 100%; max-width: 100%; object-fit: contain; padding: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display: none; padding: 1.5rem; color: white;">
          <h4 style="font-size: 1rem; font-weight: 800;">\${book.title}</h4>
          <p style="font-size: 0.75rem; color: #fde047; margin-top: 0.5rem;">Class \${book.classNumber} • \${book.medium}</p>
        </div>
      \` : \`
        <div style="padding: 1.5rem; color: white;">
          <h4 style="font-size: 1rem; font-weight: 800;">\${book.title}</h4>
          <p style="font-size: 0.75rem; color: #fde047; margin-top: 0.5rem;">Class \${book.classNumber} • \${book.medium}</p>
        </div>
      \`}
      <span style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.85); color: #fde047; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;">\${book.medium}</span>
    </div>
    <div class="book-details">
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 0.25rem;">\${book.title}</h4>
        <span style="font-size: 0.75rem; color: #1e40af; font-weight: 700;">Subject: \${book.subject}</span>
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">\${book.editionYear} • Sindh Textbook Board, Jamshoro</p>
      </div>
      \${book.pdfUrl ? \`
        <div class="book-actions">
          <button class="btn-view" id="view-btn-\${book.officialId}">View Book</button>
          <button class="btn-download" id="dl-btn-\${book.officialId}">Download</button>
        </div>
      \` : \`
        <div class="unavailable-badge">Book PDF is not available yet.</div>
      \`}
    </div>
  \`;

  // Attach handlers
  const viewBtn = card.querySelector('#view-btn-' + book.officialId);
  if (viewBtn) {
    viewBtn.onclick = () => openPDFModal(book);
  }

  const dlBtn = card.querySelector('#dl-btn-' + book.officialId);
  if (dlBtn) {
    dlBtn.onclick = (e) => {
      e.stopPropagation();
      startDirectDownload(book, dlBtn);
    };
  }

  return card;
}

// Direct Download (No Extra Tab) via Blob
async function startDirectDownload(book, buttonElement) {
  const cleanTitle = book.title.replace(/[/\\\\?%*:|"<>]/g, '').replace(/\\s+/g, '-').trim();
  const filename = 'Class-' + book.classNumber + '-' + cleanTitle + '.pdf';

  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = 'Saving...';
  }

  try {
    const streamUrl = '/api/pdf/download?id=' + encodeURIComponent(book.officialId) + '&filename=' + encodeURIComponent(filename);
    const res = await fetch(streamUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 1000);

    if (buttonElement) {
      buttonElement.textContent = 'Saved!';
      setTimeout(() => {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Download';
      }, 2000);
    }
  } catch (err) {
    console.warn('Direct blob download fallback to STBB:', err);
    // If backend proxy is not reachable, fallback directly
    window.location.href = book.downloadUrl || book.pdfUrl;
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Download';
    }
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', () => performSearch());
  }
}

function performSearch() {
  const input = document.getElementById('search-input');
  const query = input ? input.value.trim().toLowerCase() : '';
  const resultsContainer = document.getElementById('search-results-container');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';

  const results = BOOKS_DATA.filter(b => {
    return b.title.toLowerCase().includes(query) ||
           b.subject.toLowerCase().includes(query) ||
           b.medium.toLowerCase().includes(query) ||
           ('class ' + b.classNumber).includes(query);
  });

  if (results.length === 0) {
    resultsContainer.innerHTML = \`
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #ffffff; border-radius: 1rem;">
        <h3 style="font-size: 1.25rem; font-weight: 800;">No textbooks found matching your search</h3>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.5rem;">Try searching for subjects like Biology, Physics, Maths, or Class 9.</p>
      </div>
    \`;
    return;
  }

  results.forEach(book => {
    resultsContainer.appendChild(createBookCard(book));
  });
}

function setupModal() {
  const modal = document.getElementById('pdf-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const prevBtn = document.getElementById('modal-prev-btn');
  const nextBtn = document.getElementById('modal-next-btn');
  const zoomInBtn = document.getElementById('modal-zoom-in');
  const zoomOutBtn = document.getElementById('modal-zoom-out');
  const dlBtn = document.getElementById('modal-download-btn');

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
      currentPdfDoc = null;
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPdfDoc && currentPdfPage > 1) {
        currentPdfPage--;
        renderCanvasPage(currentPdfPage);
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentPdfDoc && currentPdfPage < currentPdfDoc.numPages) {
        currentPdfPage++;
        renderCanvasPage(currentPdfPage);
      }
    };
  }

  if (zoomInBtn) {
    zoomInBtn.onclick = () => {
      currentPdfScale = Math.min(currentPdfScale + 0.25, 2.5);
      document.getElementById('modal-zoom-level').textContent = Math.round(currentPdfScale * 100) + '%';
      renderCanvasPage(currentPdfPage);
    };
  }

  if (zoomOutBtn) {
    zoomOutBtn.onclick = () => {
      currentPdfScale = Math.max(currentPdfScale - 0.25, 0.6);
      document.getElementById('modal-zoom-level').textContent = Math.round(currentPdfScale * 100) + '%';
      renderCanvasPage(currentPdfPage);
    };
  }

  if (dlBtn) {
    dlBtn.onclick = () => {
      if (activeViewingBook) {
        startDirectDownload(activeViewingBook, dlBtn);
      }
    };
  }

  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentPdfDoc = null;
    }
  };
}

// In-App PDF.js Canvas Rendering
async function openPDFModal(book) {
  activeViewingBook = book;
  const modal = document.getElementById('pdf-modal');
  const titleEl = document.getElementById('modal-book-title');
  const officialLink = document.getElementById('modal-official-link');
  const canvas = document.getElementById('pdf-canvas');
  const loadingMsg = document.getElementById('modal-loading-msg');

  titleEl.textContent = book.title + ' (Class ' + book.classNumber + ')';
  if (officialLink) officialLink.href = book.officialPageUrl || 'https://ebooks.stbb.edu.pk/';

  modal.style.display = 'flex';
  canvas.style.display = 'none';
  loadingMsg.style.display = 'block';
  loadingMsg.textContent = 'Loading textbook pages from STBB...';

  currentPdfPage = 1;
  currentPdfScale = window.innerWidth < 640 ? 0.8 : 1.2;
  document.getElementById('modal-zoom-level').textContent = Math.round(currentPdfScale * 100) + '%';

  const streamUrl = '/api/pdf/stream?id=' + encodeURIComponent(book.officialId);

  try {
    if (!window.pdfjsLib) throw new Error('PDF.js library not loaded');

    const loadingTask = pdfjsLib.getDocument({
      url: streamUrl,
      withCredentials: false
    });

    currentPdfDoc = await loadingTask.promise;
    document.getElementById('modal-total-pages').textContent = currentPdfDoc.numPages;

    loadingMsg.style.display = 'none';
    canvas.style.display = 'block';
    renderCanvasPage(1);
  } catch (err) {
    console.error('PDF.js loading failed:', err);
    loadingMsg.innerHTML = '<div style="color: #ef4444; max-width: 400px; text-align: center;"><p style="font-weight: 700;">Unable to render textbook in canvas</p><p style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.5rem;">' + (err.message || 'Stream error') + '</p><a href="' + (book.downloadUrl || book.pdfUrl) + '" target="_blank" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #f59e0b; color: #000; font-weight: 700; border-radius: 8px; text-decoration: none;">Download PDF Directly</a></div>';
  }
}

async function renderCanvasPage(pageNum) {
  if (!currentPdfDoc) return;
  const canvas = document.getElementById('pdf-canvas');
  const ctx = canvas.getContext('2d');

  document.getElementById('modal-current-page').textContent = pageNum;

  try {
    const page = await currentPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: currentPdfScale });

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
  } catch (err) {
    console.error('Canvas render error:', err);
  }
}

window.switchTab = switchTab;
window.selectClass = selectClass;
window.openPDFModal = openPDFModal;
`;

fs.writeFileSync('vanilla/script.js', js);
console.log('Successfully updated vanilla/script.js with PDF.js canvas reader & direct download!');
