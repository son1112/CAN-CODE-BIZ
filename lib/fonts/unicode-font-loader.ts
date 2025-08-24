/**
 * Font loader for jsPDF with Unicode support
 * Font: NotoSansRegular
 */

import jsPDF from 'jspdf';
import { NotoSansRegularFont } from './NotoSansRegular.js';

/**
 * Add Unicode font to jsPDF instance
 */
export function addUnicodeFont(doc: jsPDF): void {
  // Add font to VFS
  doc.addFileToVFS('NotoSansRegular.ttf', NotoSansRegularFont);

  // Register font
  doc.addFont('NotoSansRegular.ttf', 'NotoSansRegular', 'normal');

  // Set as default font for Unicode support
  doc.setFont('NotoSansRegular');
}

/**
 * Create jsPDF instance with Unicode font pre-loaded
 */
export function createUnicodePDF(options = {}): jsPDF {
  const doc = new jsPDF(options);
  addUnicodeFont(doc);
  return doc;
}

export default { addUnicodeFont, createUnicodePDF };
