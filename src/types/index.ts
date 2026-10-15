export type GradeLevel = 'Primary' | 'Middle' | 'Secondary (Matric)' | 'Higher Secondary (Inter)';

export type LanguageMedium = 'English' | 'Sindhi' | 'Urdu';

export interface Book {
  id: string;
  officialId?: string; // e.g. "117" from portal.stbb.edu.pk/ebooks/book.php?id=117
  driveFileId?: string; // Public Google Drive file ID used by the in-app PDF reader
  driveViewUrl?: string; // Public Google Drive preview URL
  driveDownloadUrl?: string; // Public Google Drive download URL
  title: string;
  titleSindhi?: string;
  titleUrdu?: string;
  classNumber: number; // 1 to 12
  subjectId: string;
  subjectName: string;
  medium: LanguageMedium;
  editionYear: string;
  publisher: string;
  syllabusType: 'STBB Official Curriculum' | 'Single National Curriculum (SNC)' | 'Revised STBB' | 'Standard STBB';
  isVerifiedSyllabus: boolean;
  isPdfAvailable: boolean;
  coverUrl?: string; // Genuine textbook front cover image from official STBB source
  pdfUrl?: string; // Official PDF streaming URL
  downloadUrl?: string; // Official download URL
  officialPageUrl?: string; // Official web portal book page
  verifiedSource: string; // e.g. "https://ebooks.stbb.edu.pk/"
  isOfficialSource: boolean;
  coverAccentColor?: string;
  fileSize?: string;
  pages?: number;
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  nameSindhi?: string;
  nameUrdu?: string;
  classNumber: number;
  iconName: string;
  isVerified: boolean; // Verified against STBB official syllabus
  description: string;
  books: Book[];
}

export interface ClassInfo {
  classNumber: number;
  title: string;
  romanNumeral: string;
  level: GradeLevel;
  tagline: string;
  ageGroup: string;
  subjectsCount: number;
  verifiedSyllabus: boolean;
  officialClassId?: number; // Official STBB class.php ID
}
