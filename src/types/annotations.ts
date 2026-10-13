export interface AnnotationPoint {
  x: number; // Normalized coordinate 0..1 relative to page width
  y: number; // Normalized coordinate 0..1 relative to page height
}

export type AnnotationToolType = 'cursor' | 'pen' | 'highlighter' | 'eraser';

export interface AnnotationStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number; // normalized stroke width or base width in px
  opacity: number;
  points: AnnotationPoint[];
  createdAt?: number;
}

export interface PageAnnotationsMap {
  [pageNumber: number]: AnnotationStroke[];
}
