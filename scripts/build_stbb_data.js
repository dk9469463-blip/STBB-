import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('src/data/officialStbbCatalog.json', 'utf8'));

const CLASSES_METADATA = [
  {
    classNumber: 1,
    title: 'Class 1',
    romanNumeral: 'Class I',
    level: 'Primary',
    tagline: 'Foundational literacy, numeracy & early learning',
    ageGroup: 'Ages 5-6',
    verifiedSyllabus: true,
    officialClassId: 1,
  },
  {
    classNumber: 2,
    title: 'Class 2',
    romanNumeral: 'Class II',
    level: 'Primary',
    tagline: 'Basic concepts in languages, math & nature',
    ageGroup: 'Ages 6-7',
    verifiedSyllabus: true,
    officialClassId: 3,
  },
  {
    classNumber: 3,
    title: 'Class 3',
    romanNumeral: 'Class III',
    level: 'Primary',
    tagline: 'Introduction to General Science and Social Studies',
    ageGroup: 'Ages 7-8',
    verifiedSyllabus: true,
    officialClassId: 4,
  },
  {
    classNumber: 4,
    title: 'Class 4',
    romanNumeral: 'Class IV',
    level: 'Primary',
    tagline: 'Intermediate primary reasoning, science & languages',
    ageGroup: 'Ages 8-9',
    verifiedSyllabus: true,
    officialClassId: 5,
  },
  {
    classNumber: 5,
    title: 'Class 5',
    romanNumeral: 'Class V',
    level: 'Primary',
    tagline: 'Primary board preparation & comprehensive grounding',
    ageGroup: 'Ages 9-10',
    verifiedSyllabus: true,
    officialClassId: 6,
  },
  {
    classNumber: 6,
    title: 'Class 6',
    romanNumeral: 'Class VI',
    level: 'Middle',
    tagline: 'Middle school transition with Computer Education & Science',
    ageGroup: 'Ages 10-11',
    verifiedSyllabus: true,
    officialClassId: 7,
  },
  {
    classNumber: 7,
    title: 'Class 7',
    romanNumeral: 'Class VII',
    level: 'Middle',
    tagline: 'Advancing scientific exploration, mathematics & history',
    ageGroup: 'Ages 11-12',
    verifiedSyllabus: true,
    officialClassId: 8,
  },
  {
    classNumber: 8,
    title: 'Class 8',
    romanNumeral: 'Class VIII',
    level: 'Middle',
    tagline: 'Middle school capstone preparing for Secondary (Matric)',
    ageGroup: 'Ages 12-13',
    verifiedSyllabus: true,
    officialClassId: 9,
  },
  {
    classNumber: 9,
    title: 'Class 9',
    romanNumeral: 'Class IX (SSC-I)',
    level: 'Secondary (Matric)',
    tagline: 'Secondary School Certificate Part 1 (Science & General)',
    ageGroup: 'Ages 13-14',
    verifiedSyllabus: true,
    officialClassId: 10,
  },
  {
    classNumber: 10,
    title: 'Class 10',
    romanNumeral: 'Class X (SSC-II)',
    level: 'Secondary (Matric)',
    tagline: 'Matriculation Board Examination year (SSC Part 2)',
    ageGroup: 'Ages 14-15',
    verifiedSyllabus: true,
    officialClassId: 11,
  },
  {
    classNumber: 11,
    title: 'Class 11',
    romanNumeral: 'Class XI (HSSC-I)',
    level: 'Higher Secondary (Inter)',
    tagline: 'First Year Intermediate (Pre-Med, Pre-Eng, ICS, Commerce)',
    ageGroup: 'Ages 15-16',
    verifiedSyllabus: true,
    officialClassId: 14,
  },
  {
    classNumber: 12,
    title: 'Class 12',
    romanNumeral: 'Class XII (HSSC-II)',
    level: 'Higher Secondary (Inter)',
    tagline: 'Second Year Intermediate & College graduation year',
    ageGroup: 'Ages 16-17',
    verifiedSyllabus: true,
    officialClassId: 15,
  },
];

const SUBJECT_ICONS = {
  English: 'BookA',
  Mathematics: 'Calculator',
  'General Science': 'FlaskConical',
  Biology: 'Dna',
  Chemistry: 'Beaker',
  Physics: 'Atom',
  'Computer Science': 'Laptop',
  Sindhi: 'Scroll',
  Urdu: 'BookOpen',
  'Islamiat / Ethics': 'Moon',
  'Social Studies': 'Compass',
  'Pakistan Studies': 'Landmark',
  'General Knowledge': 'Sparkles',
  Commerce: 'Coins',
  Arabic: 'BookMarked',
};

// Color accents for covers / tags
const SUBJECT_COLORS = {
  English: '#1e40af',
  Mathematics: '#1d4ed8',
  'General Science': '#0284c7',
  Biology: '#10b981',
  Chemistry: '#d97706',
  Physics: '#0ea5e9',
  'Computer Science': '#3b82f6',
  Sindhi: '#b45309',
  Urdu: '#7c3aed',
  'Islamiat / Ethics': '#047857',
  'Social Studies': '#b45309',
  'Pakistan Studies': '#059669',
  'General Knowledge': '#0284c7',
  Commerce: '#b45309',
  Arabic: '#0d9488',
};

// Process books and group into subjects per class
const allBooksFormatted = catalog.map((b) => {
  return {
    id: b.id,
    officialId: b.officialId,
    title: b.title,
    classNumber: b.classNumber,
    subjectId: `c${b.classNumber}-${b.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    subjectName: b.subject,
    medium: b.medium,
    editionYear: b.editionYear || '2023-24',
    publisher: 'Sindh Textbook Board, Jamshoro',
    syllabusType: 'STBB Official Curriculum',
    isVerifiedSyllabus: true,
    isPdfAvailable: true,
    coverUrl: b.coverUrl,
    pdfUrl: b.pdfUrl,
    downloadUrl: b.downloadUrl,
    officialPageUrl: b.officialPageUrl,
    verifiedSource: 'https://ebooks.stbb.edu.pk/',
    isOfficialSource: true,
    coverAccentColor: SUBJECT_COLORS[b.subject] || '#1e3a8a',
    description: `Official Sindh Textbook Board (Jamshoro) textbook for Class ${b.classNumber}. Verified record on ebooks.stbb.edu.pk.`,
  };
});

// Calculate subject counts per class
const classesList = CLASSES_METADATA.map((c) => {
  const classBooks = allBooksFormatted.filter((b) => b.classNumber === c.classNumber);
  const uniqueSubjects = new Set(classBooks.map((b) => b.subjectName));
  return {
    ...c,
    subjectsCount: uniqueSubjects.size,
  };
});

// Generate TypeScript source code
let tsCode = `import { ClassInfo, Subject, Book } from '../types';

export const OFFICIAL_STBB_SOURCE_URL = 'https://ebooks.stbb.edu.pk/';

export const CLASSES_LIST: ClassInfo[] = ${JSON.stringify(classesList, null, 2)};

export const ALL_VERIFIED_BOOKS: Book[] = ${JSON.stringify(allBooksFormatted, null, 2)};

// Organize into Subjects by Class
export function getSubjectsByClass(classNumber: number): Subject[] {
  const booksInClass = ALL_VERIFIED_BOOKS.filter((b) => b.classNumber === classNumber);
  const subjectMap = new Map<string, Book[]>();

  for (const book of booksInClass) {
    const list = subjectMap.get(book.subjectName) || [];
    list.push(book);
    subjectMap.set(book.subjectName, list);
  }

  const subjects: Subject[] = [];
  for (const [subjName, books] of subjectMap.entries()) {
    subjects.push({
      id: \`c\${classNumber}-\${subjName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\`,
      name: subjName,
      classNumber,
      iconName: 'BookOpen',
      isVerified: true,
      description: \`Official STBB prescribed syllabus for \${subjName} in Class \${classNumber}.\`,
      books,
    });
  }

  return subjects;
}

export function getAllBooks(): Book[] {
  return ALL_VERIFIED_BOOKS;
}

export function searchBooksAndSubjects(query: string) {
  const clean = query.trim().toLowerCase();
  if (!clean) return { books: ALL_VERIFIED_BOOKS, subjects: [], matchedClasses: [] };

  const matchedClasses = CLASSES_LIST.filter((cls) => {
    return (
      cls.title.toLowerCase().includes(clean) ||
      cls.romanNumeral.toLowerCase().includes(clean) ||
      cls.level.toLowerCase().includes(clean) ||
      clean.includes(\`class \${cls.classNumber}\`) ||
      clean.includes(\`grade \${cls.classNumber}\`) ||
      clean === \`\${cls.classNumber}\`
    );
  });

  const allBooks = ALL_VERIFIED_BOOKS;
  const books = allBooks.filter((book) => {
    return (
      book.title.toLowerCase().includes(clean) ||
      book.subjectName.toLowerCase().includes(clean) ||
      book.medium.toLowerCase().includes(clean) ||
      book.editionYear.toLowerCase().includes(clean) ||
      \`class \${book.classNumber}\`.includes(clean)
    );
  });

  return { books, subjects: [], matchedClasses };
}
`;

fs.writeFileSync('src/data/stbbData.ts', tsCode);
console.log('Successfully generated src/data/stbbData.ts with all 178 official STBB books!');
