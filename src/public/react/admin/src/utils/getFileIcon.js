// src/utils/getFileIcon.js
export function getFileIcon(mimeType) {
  if (!mimeType) return 'fa-file';
  const type = mimeType.toLowerCase();
  if (type.includes('pdf')) return 'fa-file-pdf';
  if (type.includes('image')) return 'fa-file-image';
  if (type.includes('video')) return 'fa-file-video';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-file-excel';
  if (type.includes('word') || type.includes('document')) return 'fa-file-word';
  if (type.includes('powerpoint')) return 'fa-file-powerpoint';
  if (type.includes('audio')) return 'fa-file-audio';
  return 'fa-file';
}