/**
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

const BOOKS_DATA = [
  {
    "id": "stbb-official-139",
    "officialId": "139",
    "title": "English Book I",
    "classNumber": 1,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/65814991.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=139",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=139&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=139",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-39",
    "officialId": "39",
    "title": "General Knowledge I",
    "classNumber": 1,
    "subject": "General Knowledge",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1162331134.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=39",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=39&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=39",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-47",
    "officialId": "47",
    "title": "General Knowledge I",
    "classNumber": 1,
    "subject": "General Knowledge",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/367271721.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=47",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=47&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=47",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-48",
    "officialId": "48",
    "title": "General Knowledge I",
    "classNumber": 1,
    "subject": "General Knowledge",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1603951588.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=48",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=48&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=48",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-40",
    "officialId": "40",
    "title": "Math I",
    "classNumber": 1,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69aff061bbdac.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=40",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=40&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=40",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-208",
    "officialId": "208",
    "title": "Riazi I",
    "classNumber": 1,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/744806777.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=208",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=208&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=208",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-271",
    "officialId": "271",
    "title": "Riazi Sindhi I",
    "classNumber": 1,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69d37a7b7308c.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=271",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=271&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=271",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-42",
    "officialId": "42",
    "title": "Sindhi Reader I",
    "classNumber": 1,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/796908243.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=42",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=42&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=42",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-15",
    "officialId": "15",
    "title": "Urdu Reader",
    "classNumber": 1,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1862146349.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=15",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=15&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=15",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-79",
    "officialId": "79",
    "title": "General Knowledge II",
    "classNumber": 2,
    "subject": "General Knowledge",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/974128929.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=79",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=79&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=79",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-104",
    "officialId": "104",
    "title": "General Knowledge II",
    "classNumber": 2,
    "subject": "General Knowledge",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/571938534.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=104",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=104&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=104",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-135",
    "officialId": "135",
    "title": "General Knowledge II",
    "classNumber": 2,
    "subject": "General Knowledge",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/595504853.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=135",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=135&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=135",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-86",
    "officialId": "86",
    "title": "Math II",
    "classNumber": 2,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69aff3028e889.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=86",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=86&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=86",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-140",
    "officialId": "140",
    "title": "My English II",
    "classNumber": 2,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69ca4dfe5d0c8.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=140",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=140&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=140",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-280",
    "officialId": "280",
    "title": "Riazi II Sindhi",
    "classNumber": 2,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1920280603.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=280",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=280&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=280",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-281",
    "officialId": "281",
    "title": "Riazi II Urdu",
    "classNumber": 2,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/405168491.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=281",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=281&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=281",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-88",
    "officialId": "88",
    "title": "Sindhi Reader II",
    "classNumber": 2,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b10eaa79a73.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=88",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=88&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=88",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-16",
    "officialId": "16",
    "title": "Urdu Reader II",
    "classNumber": 2,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/914182433.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=16",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=16&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=16",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-300",
    "officialId": "300",
    "title": "Asan Sindhi III",
    "classNumber": 3,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06cb40a639.jpeg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=300",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=300&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=300",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-236",
    "officialId": "236",
    "title": "Asan Urdu III",
    "classNumber": 3,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1961814676.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=236",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=236&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=236",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-105",
    "officialId": "105",
    "title": "General Knowledge III",
    "classNumber": 3,
    "subject": "General Knowledge",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/56950476.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=105",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=105&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=105",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-112",
    "officialId": "112",
    "title": "General Knowledge III",
    "classNumber": 3,
    "subject": "General Knowledge",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/802755270.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=112",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=112&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=112",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-113",
    "officialId": "113",
    "title": "General Knowledge III",
    "classNumber": 3,
    "subject": "General Knowledge",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/907343615.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=113",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=113&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=113",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-256",
    "officialId": "256",
    "title": "Islamiyat III",
    "classNumber": 3,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c502f8019c1.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=256",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=256&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=256",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-257",
    "officialId": "257",
    "title": "Ismaiyat III",
    "classNumber": 3,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1320610153.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=257",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=257&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=257",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-85",
    "officialId": "85",
    "title": "Math III",
    "classNumber": 3,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1014940331.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=85",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=85&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=85",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-241",
    "officialId": "241",
    "title": "Mazhabi Taleemat III",
    "classNumber": 3,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/321031405.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=241",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=241&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=241",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-244",
    "officialId": "244",
    "title": "Mazhabi taleemat III",
    "classNumber": 3,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1578996762.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=244",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=244&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=244",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-141",
    "officialId": "141",
    "title": "My English III",
    "classNumber": 3,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/65116374.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=141",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=141&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=141",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-192",
    "officialId": "192",
    "title": "Riazi III",
    "classNumber": 3,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1392694364.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=192",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=192&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=192",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-209",
    "officialId": "209",
    "title": "Riazi III",
    "classNumber": 3,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1061619935.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=209",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=209&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=209",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-89",
    "officialId": "89",
    "title": "Sindhi Reader III",
    "classNumber": 3,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b10f628240b.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=89",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=89&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=89",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-17",
    "officialId": "17",
    "title": "Urdu Reader III",
    "classNumber": 3,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1787801777.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=17",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=17&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=17",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-312",
    "officialId": "312",
    "title": "Asan Sindhi IV",
    "classNumber": 4,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06d2e08d3c.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=312",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=312&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=312",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-237",
    "officialId": "237",
    "title": "Asan Urdu IV",
    "classNumber": 4,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2026-27",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1173663970.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=237",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=237&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=237",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-258",
    "officialId": "258",
    "title": "Islamiyat IV",
    "classNumber": 4,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c505c60b3c2.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=258",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=258&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=258",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-128",
    "officialId": "128",
    "title": "Mashrati Uloom IV",
    "classNumber": 4,
    "subject": "Social Studies",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1892289803.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=128",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=128&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=128",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-87",
    "officialId": "87",
    "title": "Math IV",
    "classNumber": 4,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1294149111.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=87",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=87&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=87",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-242",
    "officialId": "242",
    "title": "Mazhabi taleemat IV",
    "classNumber": 4,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1707746438.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=242",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=242&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=242",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-246",
    "officialId": "246",
    "title": "Mazhabi taleemat IV",
    "classNumber": 4,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/468929419.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=246",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=246&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=246",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-142",
    "officialId": "142",
    "title": "My English IV",
    "classNumber": 4,
    "subject": "English",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/266511708.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=142",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=142&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=142",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-278",
    "officialId": "278",
    "title": "Riazi Sindh IV",
    "classNumber": 4,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/831334145.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=278",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=278&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=278",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-269",
    "officialId": "269",
    "title": "Riazi Urdu IV",
    "classNumber": 4,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/121054620.jpeg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=269",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=269&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=269",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-84",
    "officialId": "84",
    "title": "Science IV",
    "classNumber": 4,
    "subject": "General Science",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/454888833.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=84",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=84&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=84",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-101",
    "officialId": "101",
    "title": "Science IV",
    "classNumber": 4,
    "subject": "General Science",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1597681698.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=101",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=101&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=101",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-103",
    "officialId": "103",
    "title": "Science IV",
    "classNumber": 4,
    "subject": "General Science",
    "medium": "Sindhi",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/886464584.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=103",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=103&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=103",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-90",
    "officialId": "90",
    "title": "Sindhi Reader IV",
    "classNumber": 4,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b112f860c9b.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=90",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=90&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=90",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-107",
    "officialId": "107",
    "title": "Smajhi Abhiyas IV",
    "classNumber": 4,
    "subject": "Social Studies",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/259431052.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=107",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=107&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=107",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-124",
    "officialId": "124",
    "title": "Social Studies IV",
    "classNumber": 4,
    "subject": "Social Studies",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/47504706.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=124",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=124&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=124",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-18",
    "officialId": "18",
    "title": "Urdu Reader IV",
    "classNumber": 4,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1331526740.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=18",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=18&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=18",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-65",
    "officialId": "65",
    "title": "Asaan Sindhi V",
    "classNumber": 5,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06dc55346a.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=65",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=65&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=65",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-10",
    "officialId": "10",
    "title": "Asan Urdu V",
    "classNumber": 5,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1410794645.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=10",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=10&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=10",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-259",
    "officialId": "259",
    "title": "Islamiyat V",
    "classNumber": 5,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c50d40b8cf1.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=259",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=259&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=259",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-129",
    "officialId": "129",
    "title": "Mashrati Uloom V",
    "classNumber": 5,
    "subject": "Social Studies",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1061796076.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=129",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=129&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=129",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-95",
    "officialId": "95",
    "title": "Math V",
    "classNumber": 5,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1819118047.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=95",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=95&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=95",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-243",
    "officialId": "243",
    "title": "Mazhabi taleemat V",
    "classNumber": 5,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1033637287.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=243",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=243&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=243",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-245",
    "officialId": "245",
    "title": "Mazhabi taleemat V",
    "classNumber": 5,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1150431289.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=245",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=245&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=245",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-144",
    "officialId": "144",
    "title": "My English V",
    "classNumber": 5,
    "subject": "English",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2051853001.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=144",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=144&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=144",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-268",
    "officialId": "268",
    "title": "Riazi V",
    "classNumber": 5,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1429061587.jpeg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=268",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=268&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=268",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-210",
    "officialId": "210",
    "title": "Riazi V",
    "classNumber": 5,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/662147910.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=210",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=210&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=210",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-83",
    "officialId": "83",
    "title": "Science V",
    "classNumber": 5,
    "subject": "General Science",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1448703297.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=83",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=83&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=83",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-102",
    "officialId": "102",
    "title": "Science V",
    "classNumber": 5,
    "subject": "General Science",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/139496061.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=102",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=102&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=102",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-120",
    "officialId": "120",
    "title": "Science V",
    "classNumber": 5,
    "subject": "General Science",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1794165409.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=120",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=120&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=120",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-91",
    "officialId": "91",
    "title": "Sindhi Reader V",
    "classNumber": 5,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1255089430.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=91",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=91&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=91",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-108",
    "officialId": "108",
    "title": "Smajhi Abhiyas V",
    "classNumber": 5,
    "subject": "Social Studies",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1148517295.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=108",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=108&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=108",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-80",
    "officialId": "80",
    "title": "Social Studies V",
    "classNumber": 5,
    "subject": "Social Studies",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/99532107.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=80",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=80&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=80",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-19",
    "officialId": "19",
    "title": "Urdu Reader V",
    "classNumber": 5,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/181804915.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=19",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=19&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=19",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-41",
    "officialId": "41",
    "title": "Arabic VI",
    "classNumber": 6,
    "subject": "Arabic",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1541562650.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=41",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=41&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=41",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-43",
    "officialId": "43",
    "title": "Arabic VI",
    "classNumber": 6,
    "subject": "Arabic",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/267094828.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=43",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=43&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=43",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-46",
    "officialId": "46",
    "title": "Arabic VI",
    "classNumber": 6,
    "subject": "Arabic",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2038875491.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=46",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=46&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=46",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-229",
    "officialId": "229",
    "title": "Arabic VI",
    "classNumber": 6,
    "subject": "Arabic",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/35368222.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=229",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=229&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=229",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-66",
    "officialId": "66",
    "title": "Asaan Sindhi VI",
    "classNumber": 6,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/721177732.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=66",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=66&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=66",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-314",
    "officialId": "314",
    "title": "Asan Sindhi VI",
    "classNumber": 6,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06e1a759fc.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=314",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=314&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=314",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-11",
    "officialId": "11",
    "title": "Asan Urdu VI",
    "classNumber": 6,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/207570828.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=11",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=11&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=11",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-287",
    "officialId": "287",
    "title": "Computer Education - VI",
    "classNumber": 6,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1618270194.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=287",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=287&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=287",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-289",
    "officialId": "289",
    "title": "Computer Ji Taleem - VI",
    "classNumber": 6,
    "subject": "Computer Science",
    "medium": "Sindhi",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/279266181.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=289",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=289&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=289",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-288",
    "officialId": "288",
    "title": "Computer Ki Taleem - VI",
    "classNumber": 6,
    "subject": "Computer Science",
    "medium": "Urdu",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1896936288.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=288",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=288&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=288",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-260",
    "officialId": "260",
    "title": "Islamiyat VI",
    "classNumber": 6,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1426492513.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=260",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=260&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=260",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-25",
    "officialId": "25",
    "title": "Islamiyat VI",
    "classNumber": 6,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/229620463.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=25",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=25&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=25",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-29",
    "officialId": "29",
    "title": "Islamiyat VI",
    "classNumber": 6,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1175457407.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=29",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=29&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=29",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-131",
    "officialId": "131",
    "title": "Mashrati Uloom VI",
    "classNumber": 6,
    "subject": "Social Studies",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2120285454.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=131",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=131&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=131",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-96",
    "officialId": "96",
    "title": "Math VI",
    "classNumber": 6,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/775561716.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=96",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=96&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=96",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-238",
    "officialId": "238",
    "title": "Mazhabi Taleemat VI",
    "classNumber": 6,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/486172951.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=238",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=238&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=238",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-249",
    "officialId": "249",
    "title": "Mazhabi Taleemat VI",
    "classNumber": 6,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1588906171.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=249",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=249&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=249",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-143",
    "officialId": "143",
    "title": "My English VI",
    "classNumber": 6,
    "subject": "English",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1860803070.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=143",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=143&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=143",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-270",
    "officialId": "270",
    "title": "Riazi Sindhi VI",
    "classNumber": 6,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1828442850.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=270",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=270&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=270",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-115",
    "officialId": "115",
    "title": "Science VI",
    "classNumber": 6,
    "subject": "General Science",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1234482609.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=115",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=115&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=115",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-232",
    "officialId": "232",
    "title": "Arabic VII",
    "classNumber": 7,
    "subject": "Arabic",
    "medium": "Urdu",
    "editionYear": "2025",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69aff50409dbf.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=232",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=232&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=232",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-315",
    "officialId": "315",
    "title": "Asan Sindhi VII",
    "classNumber": 7,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06e78e4847.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=315",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=315&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=315",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-12",
    "officialId": "12",
    "title": "Asan Urdu VII",
    "classNumber": 7,
    "subject": "Urdu",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/239314557.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=12",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=12&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=12",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-317",
    "officialId": "317",
    "title": "Computer Education",
    "classNumber": 7,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69affa18825b0.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=317",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=317&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=317",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-319",
    "officialId": "319",
    "title": "Computer Ji Taleem",
    "classNumber": 7,
    "subject": "Computer Science",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b29184a9990.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=319",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=319&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=319",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-320",
    "officialId": "320",
    "title": "Computer Ki Taleem",
    "classNumber": 7,
    "subject": "Computer Science",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b2953097493.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=320",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=320&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=320",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-261",
    "officialId": "261",
    "title": "Islamiyat VII",
    "classNumber": 7,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1039470295.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=261",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=261&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=261",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-136",
    "officialId": "136",
    "title": "Islamiyat VII",
    "classNumber": 7,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/843746128.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=136",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=136&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=136",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-137",
    "officialId": "137",
    "title": "Islamiyat VII",
    "classNumber": 7,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/928138228.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=137",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=137&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=137",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-130",
    "officialId": "130",
    "title": "Mashrati Uloom VII",
    "classNumber": 7,
    "subject": "Social Studies",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1922245165.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=130",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=130&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=130",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-97",
    "officialId": "97",
    "title": "Math VII",
    "classNumber": 7,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/611311975.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=97",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=97&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=97",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-239",
    "officialId": "239",
    "title": "Mazhabi Taleemat VII",
    "classNumber": 7,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/63691707.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=239",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=239&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=239",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-251",
    "officialId": "251",
    "title": "Mazhabi Taleemat VII",
    "classNumber": 7,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1016741158.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=251",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=251&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=251",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-145",
    "officialId": "145",
    "title": "My English VII",
    "classNumber": 7,
    "subject": "English",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1091621426.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=145",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=145&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=145",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-282",
    "officialId": "282",
    "title": "Riazi Sindhi VII",
    "classNumber": 7,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1090872396.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=282",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=282&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=282",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-279",
    "officialId": "279",
    "title": "Riazi Urdu VII",
    "classNumber": 7,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/107179931.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=279",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=279&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=279",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-114",
    "officialId": "114",
    "title": "Science VII",
    "classNumber": 7,
    "subject": "General Science",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/427621562.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=114",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=114&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=114",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-116",
    "officialId": "116",
    "title": "Science VII",
    "classNumber": 7,
    "subject": "General Science",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1190358491.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=116",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=116&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=116",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-125",
    "officialId": "125",
    "title": "Science VII",
    "classNumber": 7,
    "subject": "General Science",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/885196636.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=125",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=125&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=125",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-93",
    "officialId": "93",
    "title": "Sindhi Reader VII",
    "classNumber": 7,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/489359943.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=93",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=93&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=93",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-233",
    "officialId": "233",
    "title": "Arabic VIII",
    "classNumber": 8,
    "subject": "Arabic",
    "medium": "Urdu",
    "editionYear": "2024",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69aff63ea8916.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=233",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=233&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=233",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-69",
    "officialId": "69",
    "title": "Asaan Sindhi VIII",
    "classNumber": 8,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06f01e1940.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=69",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=69&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=69",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-24",
    "officialId": "24",
    "title": "Asan Urdu VIII",
    "classNumber": 8,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2040673937.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=24",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=24&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=24",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-322",
    "officialId": "322",
    "title": "Computer Education",
    "classNumber": 8,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b3d47ecc2e9.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=322",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=322&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=322",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-292",
    "officialId": "292",
    "title": "Computer Taleem VIII",
    "classNumber": 8,
    "subject": "Computer Science",
    "medium": "Urdu",
    "editionYear": "2025",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1981124007.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=292",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=292&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=292",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-32",
    "officialId": "32",
    "title": "Islamiyat VIII",
    "classNumber": 8,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b28cbc23e24.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=32",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=32&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=32",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-138",
    "officialId": "138",
    "title": "Islamiyat VIII",
    "classNumber": 8,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1851536235.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=138",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=138&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=138",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-262",
    "officialId": "262",
    "title": "Islmaiyat VIII",
    "classNumber": 8,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1052614018.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=262",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=262&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=262",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-283",
    "officialId": "283",
    "title": "Math VIII",
    "classNumber": 8,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/93413431.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=283",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=283&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=283",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-248",
    "officialId": "248",
    "title": "Mazhabi Taleemat  VIII",
    "classNumber": 8,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/521031776.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=248",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=248&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=248",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-240",
    "officialId": "240",
    "title": "Mazhabi Taleemat VIII",
    "classNumber": 8,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/235875711.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=240",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=240&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=240",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-146",
    "officialId": "146",
    "title": "My English VIII",
    "classNumber": 8,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1533847508.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=146",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=146&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=146",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-284",
    "officialId": "284",
    "title": "Riazi Urdu VIII",
    "classNumber": 8,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/939539578.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=284",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=284&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=284",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-272",
    "officialId": "272",
    "title": "Riazi VIII",
    "classNumber": 8,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/689917875.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=272",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=272&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=272",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-98",
    "officialId": "98",
    "title": "Science VIII",
    "classNumber": 8,
    "subject": "General Science",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1374976442.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=98",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=98&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=98",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-123",
    "officialId": "123",
    "title": "Science VIII",
    "classNumber": 8,
    "subject": "General Science",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/900323740.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=123",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=123&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=123",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-126",
    "officialId": "126",
    "title": "Science VIII",
    "classNumber": 8,
    "subject": "General Science",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1346404001.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=126",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=126&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=126",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-94",
    "officialId": "94",
    "title": "Sindhi Reader VIII",
    "classNumber": 8,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/744295533.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=94",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=94&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=94",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-226",
    "officialId": "226",
    "title": "Social Studies VIII",
    "classNumber": 8,
    "subject": "Social Studies",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1801257208.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=226",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=226&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=226",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-23",
    "officialId": "23",
    "title": "Urdu Reader VIII",
    "classNumber": 8,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/527582577.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=23",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=23&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=23",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-212",
    "officialId": "212",
    "title": "Asaan Sindhi IX - X",
    "classNumber": 9,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69b06f2d69dd4.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=212",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=212&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=212",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-13",
    "officialId": "13",
    "title": "Asan Urdu IX - X",
    "classNumber": 9,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1667955905.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=13",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=13&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=13",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-117",
    "officialId": "117",
    "title": "Biology IX",
    "classNumber": 9,
    "subject": "Biology",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2069794387.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=117",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=117&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=117",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-118",
    "officialId": "118",
    "title": "Biology IX",
    "classNumber": 9,
    "subject": "Biology",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1746890541.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=118",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=118&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=118",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-119",
    "officialId": "119",
    "title": "Biology IX",
    "classNumber": 9,
    "subject": "Biology",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1161859518.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=119",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=119&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=119",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-197",
    "officialId": "197",
    "title": "Chemistry IX",
    "classNumber": 9,
    "subject": "Chemistry",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c39742cbe53.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=197",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=197&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=197",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-195",
    "officialId": "195",
    "title": "Chemsitry IX",
    "classNumber": 9,
    "subject": "Chemistry",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1620749291.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=195",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=195&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=195",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-196",
    "officialId": "196",
    "title": "Chemsitry IX",
    "classNumber": 9,
    "subject": "Chemistry",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1430154326.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=196",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=196&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=196",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-121",
    "officialId": "121",
    "title": "Computer Science IX",
    "classNumber": 9,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1441448209.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=121",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=121&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=121",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-184",
    "officialId": "184",
    "title": "Computer Science IX",
    "classNumber": 9,
    "subject": "Computer Science",
    "medium": "Sindhi",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1724460368.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=184",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=184&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=184",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-291",
    "officialId": "291",
    "title": "ComputerScience IX",
    "classNumber": 9,
    "subject": "Computer Science",
    "medium": "Urdu",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/151101432.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=291",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=291&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=291",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-265",
    "officialId": "265",
    "title": "Islamiyat IX - X",
    "classNumber": 9,
    "subject": "Islamiat / Ethics",
    "medium": "Urdu",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/663757253.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=265",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=265&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=265",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-267",
    "officialId": "267",
    "title": "Islamiyat IX-X",
    "classNumber": 9,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1129776401.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=267",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=267&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=267",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-264",
    "officialId": "264",
    "title": "Islamiyat X - IX",
    "classNumber": 9,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2068487361.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=264",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=264&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=264",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-180",
    "officialId": "180",
    "title": "Math IX",
    "classNumber": 9,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1452784081.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=180",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=180&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=180",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-147",
    "officialId": "147",
    "title": "My English IX",
    "classNumber": 9,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/868750678.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=147",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=147&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=147",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-183",
    "officialId": "183",
    "title": "Pakistan Studies IX",
    "classNumber": 9,
    "subject": "Pakistan Studies",
    "medium": "Urdu",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/501649783.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=183",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=183&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=183",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-174",
    "officialId": "174",
    "title": "Physics IX",
    "classNumber": 9,
    "subject": "Physics",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/622975132.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=174",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=174&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=174",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-247",
    "officialId": "247",
    "title": "Religious Studies IX -X",
    "classNumber": 9,
    "subject": "Islamiat / Ethics",
    "medium": "English",
    "editionYear": "2020-21",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/70559981.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=247",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=247&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=247",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-275",
    "officialId": "275",
    "title": "Riazi IX",
    "classNumber": 9,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1670965836.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=275",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=275&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=275",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-316",
    "officialId": "316",
    "title": "Asan Sindhi IX-X",
    "classNumber": 10,
    "subject": "Sindhi",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69aab648d6239.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=316",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=316&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=316",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-186",
    "officialId": "186",
    "title": "Biology X",
    "classNumber": 10,
    "subject": "Biology",
    "medium": "Sindhi",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/671322039.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=186",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=186&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=186",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-188",
    "officialId": "188",
    "title": "Biology X",
    "classNumber": 10,
    "subject": "Biology",
    "medium": "English",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1012741228.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=188",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=188&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=188",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-199",
    "officialId": "199",
    "title": "Chemistry X",
    "classNumber": 10,
    "subject": "Chemistry",
    "medium": "Sindhi",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1163133280.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=199",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=199&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=199",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-198",
    "officialId": "198",
    "title": "Chemsitry X",
    "classNumber": 10,
    "subject": "Chemistry",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/797934480.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=198",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=198&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=198",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-200",
    "officialId": "200",
    "title": "Chemsitry X",
    "classNumber": 10,
    "subject": "Chemistry",
    "medium": "Urdu",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c39a489dbcb.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=200",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=200&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=200",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-204",
    "officialId": "204",
    "title": "Computer Science X",
    "classNumber": 10,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69d6bfaa56ea7.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=204",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=204&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=204",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-205",
    "officialId": "205",
    "title": "Math X",
    "classNumber": 10,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/530438481.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=205",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=205&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=205",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-252",
    "officialId": "252",
    "title": "Mazhabi Taleemat IX - X",
    "classNumber": 10,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2021-22",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1738482689.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=252",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=252&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=252",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-227",
    "officialId": "227",
    "title": "Mutala E Pakistan",
    "classNumber": 10,
    "subject": "Pakistan Studies",
    "medium": "Urdu",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1916365777.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=227",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=227&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=227",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-235",
    "officialId": "235",
    "title": "Pak Studies X",
    "classNumber": 10,
    "subject": "Pakistan Studies",
    "medium": "English",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/765309191.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=235",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=235&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=235",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-202",
    "officialId": "202",
    "title": "Physics X",
    "classNumber": 10,
    "subject": "Physics",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/575393607.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=202",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=202&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=202",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-223",
    "officialId": "223",
    "title": "Physics X",
    "classNumber": 10,
    "subject": "Physics",
    "medium": "Sindhi",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/924203581.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=223",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=223&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=223",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-277",
    "officialId": "277",
    "title": "Riazi Urdu X",
    "classNumber": 10,
    "subject": "Mathematics",
    "medium": "Urdu",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/997723926.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=277",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=277&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=277",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-285",
    "officialId": "285",
    "title": "Riazi X",
    "classNumber": 10,
    "subject": "Mathematics",
    "medium": "Sindhi",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1514411626.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=285",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=285&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=285",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-201",
    "officialId": "201",
    "title": "Secondary Stage English X",
    "classNumber": 10,
    "subject": "English",
    "medium": "English",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1739674047.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=201",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=201&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=201",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-219",
    "officialId": "219",
    "title": "Biology XI",
    "classNumber": 11,
    "subject": "Biology",
    "medium": "English",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1906338761.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=219",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=219&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=219",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-206",
    "officialId": "206",
    "title": "Chemistry XI",
    "classNumber": 11,
    "subject": "Chemistry",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/508055262.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=206",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=206&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=206",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-324",
    "officialId": "324",
    "title": "Computer Science XI",
    "classNumber": 11,
    "subject": "Computer Science",
    "medium": "English",
    "editionYear": "2026-27",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_6aaa574eb6000.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=324",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=324&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=324",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-203",
    "officialId": "203",
    "title": "English XI",
    "classNumber": 11,
    "subject": "English",
    "medium": "English",
    "editionYear": "2022-23",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2032304972.JPG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=203",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=203&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=203",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-214",
    "officialId": "214",
    "title": "Gulzar-E-Urdu XI",
    "classNumber": 11,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/608225154.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=214",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=214&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=214",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-266",
    "officialId": "266",
    "title": "Islamiyat XI- XII",
    "classNumber": 11,
    "subject": "Islamiat / Ethics",
    "medium": "Sindhi",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/234995630.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=266",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=266&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=266",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-207",
    "officialId": "207",
    "title": "Math XI",
    "classNumber": 11,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/17724355.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=207",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=207&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=207",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-221",
    "officialId": "221",
    "title": "Physics XI",
    "classNumber": 11,
    "subject": "Physics",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1502217710.PNG",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=221",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=221&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=221",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-323",
    "officialId": "323",
    "title": "Salees Urdu",
    "classNumber": 11,
    "subject": "Urdu",
    "medium": "Sindhi",
    "editionYear": "2026",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/cover_69c4eb8998814.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=323",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=323&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=323",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-228",
    "officialId": "228",
    "title": "Biology XII",
    "classNumber": 12,
    "subject": "Biology",
    "medium": "English",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/319808494.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=228",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=228&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=228",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-218",
    "officialId": "218",
    "title": "Chemistry XII",
    "classNumber": 12,
    "subject": "Chemistry",
    "medium": "English",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/1793776781.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=218",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=218&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=218",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-216",
    "officialId": "216",
    "title": "Gulzar-E-Urdu XII",
    "classNumber": 12,
    "subject": "Urdu",
    "medium": "Urdu",
    "editionYear": "2023-24",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/470596573.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=216",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=216&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=216",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-225",
    "officialId": "225",
    "title": "Math XII",
    "classNumber": 12,
    "subject": "Mathematics",
    "medium": "English",
    "editionYear": "2024-25",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/476138304.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=225",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=225&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=225",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-215",
    "officialId": "215",
    "title": "Physics XII",
    "classNumber": 12,
    "subject": "Physics",
    "medium": "English",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/2112649985.png",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=215",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=215&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=215",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  },
  {
    "id": "stbb-official-286",
    "officialId": "286",
    "title": "Sindhi Lazmi XI- XII",
    "classNumber": 12,
    "subject": "Sindhi",
    "medium": "Sindhi",
    "editionYear": "2025-26",
    "publisher": "Sindh Textbook Board, Jamshoro",
    "syllabusType": "STBB Official Curriculum",
    "isVerifiedSyllabus": true,
    "isPdfAvailable": true,
    "coverUrl": "https://portal.stbb.edu.pk/ebooks/uploads/books_images/361795481.jpg",
    "pdfUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=286",
    "downloadUrl": "https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=286&download=1",
    "officialPageUrl": "https://portal.stbb.edu.pk/ebooks/book.php?id=286",
    "verifiedSource": "https://ebooks.stbb.edu.pk/"
  }
];

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
    card.innerHTML = `
      <div>
        <div class="class-card-header">
          <div class="class-badge">${cls.number}</div>
          <span class="tier-tag">${cls.level}</span>
        </div>
        <h3>${cls.title}</h3>
        <p>${cls.desc}</p>
        <span style="font-size: 0.75rem; color: #1e40af; font-weight: 700;">${classBooks.length} Verified Books</span>
      </div>
      <div class="class-card-footer">
        <span>View Textbooks</span>
        <span>→</span>
      </div>
    `;
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

  card.innerHTML = `
    <div class="book-cover" style="position: relative; height: 260px; padding: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      ${book.coverUrl ? `
        <img src="${book.coverUrl}" alt="${book.title}" style="max-height: 100%; max-width: 100%; object-fit: contain; padding: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display: none; padding: 1.5rem; color: white;">
          <h4 style="font-size: 1rem; font-weight: 800;">${book.title}</h4>
          <p style="font-size: 0.75rem; color: #fde047; margin-top: 0.5rem;">Class ${book.classNumber} • ${book.medium}</p>
        </div>
      ` : `
        <div style="padding: 1.5rem; color: white;">
          <h4 style="font-size: 1rem; font-weight: 800;">${book.title}</h4>
          <p style="font-size: 0.75rem; color: #fde047; margin-top: 0.5rem;">Class ${book.classNumber} • ${book.medium}</p>
        </div>
      `}
      <span style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.85); color: #fde047; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;">${book.medium}</span>
    </div>
    <div class="book-details">
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 0.25rem;">${book.title}</h4>
        <span style="font-size: 0.75rem; color: #1e40af; font-weight: 700;">Subject: ${book.subject}</span>
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">${book.editionYear} • Sindh Textbook Board, Jamshoro</p>
      </div>
      ${book.pdfUrl ? `
        <div class="book-actions">
          <button class="btn-view" id="view-btn-${book.officialId}">View Book</button>
          <button class="btn-download" id="dl-btn-${book.officialId}">Download</button>
        </div>
      ` : `
        <div class="unavailable-badge">Book PDF is not available yet.</div>
      `}
    </div>
  `;

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
  const cleanTitle = book.title.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '-').trim();
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
    resultsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #ffffff; border-radius: 1rem;">
        <h3 style="font-size: 1.25rem; font-weight: 800;">No textbooks found matching your search</h3>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.5rem;">Try searching for subjects like Biology, Physics, Maths, or Class 9.</p>
      </div>
    `;
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
