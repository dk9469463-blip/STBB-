import fs from 'node:fs';

const CLASS_MAPPING = [
  { classNumber: 1, classId: 1, name: 'Class I' },
  { classNumber: 2, classId: 3, name: 'Class II' },
  { classNumber: 3, classId: 4, name: 'Class III' },
  { classNumber: 4, classId: 5, name: 'Class IV' },
  { classNumber: 5, classId: 6, name: 'Class V' },
  { classNumber: 6, classId: 7, name: 'Class VI' },
  { classNumber: 7, classId: 8, name: 'Class VII' },
  { classNumber: 8, classId: 9, name: 'Class VIII' },
  { classNumber: 9, classId: 10, name: 'Class IX' },
  { classNumber: 10, classId: 11, name: 'Class X' },
  { classNumber: 11, classId: 14, name: 'Class XI' },
  { classNumber: 12, classId: 15, name: 'Class XII' },
];

async function fetchClassBooks(classInfo) {
  const url = `https://portal.stbb.edu.pk/ebooks/class.php?id=${classInfo.classId}`;
  console.log(`Fetching ${classInfo.name} from ${url}...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Catalog/1.0',
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch ${classInfo.name}: ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Regex to match book cards on portal.stbb.edu.pk
    // <a href="https://portal.stbb.edu.pk/ebooks/book.php?id=212" class="book-card">
    // ...
    // <img src="https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_..." alt="Asaan Sindhi..." class="book-img">
    // ...
    // <span class="book-medium-badge">Urdu</span>
    // ...
    // <div class="book-title">Asaan Sindhi IX - X</div>
    // ...
    // <div class="book-pub">IX • 2026</div>

    const books = [];
    const bookCardRegex = /<a\s+href="https:\/\/portal\.stbb\.edu\.pk\/ebooks\/book\.php\?id=(\d+)"\s+class="book-card">([\s\S]*?)<\/a>/g;
    let cardMatch;

    while ((cardMatch = bookCardRegex.exec(html)) !== null) {
      const bookId = cardMatch[1];
      const cardHtml = cardMatch[2];

      // Extract Cover
      const imgMatch = cardHtml.match(/<img\s+src="([^"]+)"\s+alt="([^"]*)"/i);
      const coverUrl = imgMatch ? imgMatch[1] : '';

      // Extract Title
      const titleMatch = cardHtml.match(/<div class="book-title">([^<]+)<\/div>/i);
      const title = titleMatch ? titleMatch[1].trim() : (imgMatch ? imgMatch[2].trim() : `Book ${bookId}`);

      // Extract Medium
      const mediumMatch = cardHtml.match(/<span class="book-medium-badge">([^<]+)<\/span>/i);
      let medium = mediumMatch ? mediumMatch[1].trim() : 'English';
      if (!['English', 'Sindhi', 'Urdu'].includes(medium)) {
        if (medium.toLowerCase().includes('sindhi')) medium = 'Sindhi';
        else if (medium.toLowerCase().includes('urdu')) medium = 'Urdu';
        else medium = 'English';
      }

      // Extract Publication/Year
      const pubMatch = cardHtml.match(/<div class="book-pub">([\s\S]*?)<\/div>/i);
      let year = '2023-24';
      if (pubMatch) {
        const rawPub = pubMatch[1].replace(/<[^>]+>/g, '').replace(/&bull;/g, '•').trim();
        const yearMatch = rawPub.match(/(20\d\d(-\d\d)?)/);
        if (yearMatch) year = yearMatch[1];
      }

      // Determine subject from title
      let subject = 'General';
      const cleanTitle = title.toLowerCase();
      if (cleanTitle.includes('math') || cleanTitle.includes('ریاضی') || cleanTitle.includes('رياضيات') || cleanTitle.includes('calculus')) subject = 'Mathematics';
      else if (cleanTitle.includes('physic') || cleanTitle.includes('طبعیات')) subject = 'Physics';
      else if (cleanTitle.includes('chem') || cleanTitle.includes('کیمیا')) subject = 'Chemistry';
      else if (cleanTitle.includes('bio') || cleanTitle.includes('حياتيات') || cleanTitle.includes('botany') || cleanTitle.includes('zoology')) subject = 'Biology';
      else if (cleanTitle.includes('computer') || cleanTitle.includes('کمپیوٹر')) subject = 'Computer Science';
      else if (cleanTitle.includes('science') || cleanTitle.includes('سائنس')) subject = 'General Science';
      else if (cleanTitle.includes('sindhi') || cleanTitle.includes('سنڌي')) subject = 'Sindhi';
      else if (cleanTitle.includes('urdu') || cleanTitle.includes('اردو')) subject = 'Urdu';
      else if (cleanTitle.includes('english') || cleanTitle.includes('انگريزي')) subject = 'English';
      else if (cleanTitle.includes('pakistan studies') || cleanTitle.includes('مطالعہ پاکستان') || cleanTitle.includes('مطالعو')) subject = 'Pakistan Studies';
      else if (cleanTitle.includes('islam') || cleanTitle.includes('اسلامیات') || cleanTitle.includes('ethics') || cleanTitle.includes('اخلاقیات')) subject = 'Islamiat / Ethics';
      else if (cleanTitle.includes('social') || cleanTitle.includes('معاشرتی') || cleanTitle.includes('سماجي')) subject = 'Social Studies';
      else if (cleanTitle.includes('account') || cleanTitle.includes('commerce') || cleanTitle.includes('bank') || cleanTitle.includes('geography')) subject = 'Commerce';
      else if (cleanTitle.includes('general knowledge') || cleanTitle.includes('معلومات')) subject = 'General Knowledge';

      books.push({
        id: `stbb-official-${bookId}`,
        officialId: bookId,
        title,
        classNumber: classInfo.classNumber,
        subject,
        medium,
        editionYear: year,
        publisher: 'Sindh Textbook Board, Jamshoro',
        syllabusType: 'STBB Official Curriculum',
        isVerifiedSyllabus: true,
        isPdfAvailable: true,
        coverUrl: coverUrl,
        pdfUrl: `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${bookId}`,
        downloadUrl: `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${bookId}&download=1`,
        officialPageUrl: `https://portal.stbb.edu.pk/ebooks/book.php?id=${bookId}`,
        verifiedSource: 'https://ebooks.stbb.edu.pk/',
      });
    }

    console.log(`Found ${books.length} official books for ${classInfo.name}`);
    return books;
  } catch (err) {
    console.error(`Error fetching ${classInfo.name}:`, err);
    return [];
  }
}

async function main() {
  const allOfficialBooks = [];

  for (const c of CLASS_MAPPING) {
    const books = await fetchClassBooks(c);
    allOfficialBooks.push(...books);
    // Pause briefly to be polite to the server
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nTOTAL OFFICIAL BOOKS SCRAPED: ${allOfficialBooks.length}`);
  fs.writeFileSync('src/data/officialStbbCatalog.json', JSON.stringify(allOfficialBooks, null, 2));
  console.log('Saved to src/data/officialStbbCatalog.json');
}

main();
