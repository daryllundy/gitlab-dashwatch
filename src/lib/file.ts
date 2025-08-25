// File utility functions
import { FILE_CONSTANTS } from '@/constants';

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateTimestampedFilename = (baseName: string, extension: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseName}-${timestamp}.${extension}`;
};

export const convertToCSV = (data: unknown): string => {
  // Simple CSV conversion - handles arrays of objects
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  }
  
  return JSON.stringify(data);
};

export const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    'json': 'application/json',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'xml': 'application/xml',
  };
  
  return mimeTypes[format.toLowerCase()] || 'text/plain';
};
