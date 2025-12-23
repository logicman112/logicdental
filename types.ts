
export type CaptureStep = 'INITIAL' | 'TRANSITION' | 'UPPER' | 'LOWER' | 'PREVIEW' | 'ANALYZING' | 'RESULT';
export type ActiveTab = 'home' | 'history' | 'tips' | 'chat';

export interface BrushingRecord {
  morning: boolean;
  lunch: boolean;
  dinner: boolean;
  gargle: boolean;
  floss: boolean;
}

export interface BrushingHistory {
  [date: string]: BrushingRecord;
}

export interface CapturedImages {
  upper: string | null;
  lower: string | null;
}

export interface AnalysisSection {
  title: string;
  content: string;
  type: 'observation' | 'recommendation' | 'warning';
}

export interface AnalysisResponse {
  summary: string;
  scalingRequired: boolean;
  scalingUrgency: 'low' | 'medium' | 'high';
  sections: AnalysisSection[];
}

export interface DiagnosisRecord {
  id: string;
  date: string;
  images: CapturedImages;
  analysis: AnalysisResponse;
}
