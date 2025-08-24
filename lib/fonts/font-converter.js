/**
 * Font converter utility for jsPDF Unicode support
 * Converts TTF fonts to base64 format for embedding in PDFs
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert TTF font file to base64 string for jsPDF
 */
function convertTTFToBase64(fontPath, outputPath) {
  try {
    console.log(`Converting font: ${fontPath}`);

    // Read the TTF file as binary
    const fontBuffer = fs.readFileSync(fontPath);

    // Convert to base64
    const base64Font = fontBuffer.toString('base64');

    // Create the font module for jsPDF
    const fontName = path.basename(fontPath, '.ttf');
    const fontModule = `/**
 * ${fontName} font for jsPDF with Unicode support
 * Generated from: ${path.basename(fontPath)}
 * Date: ${new Date().toISOString()}
 */

const ${fontName.replace(/[^a-zA-Z0-9]/g, '')}Font = '${base64Font}';

export { ${fontName.replace(/[^a-zA-Z0-9]/g, '')}Font };
export default ${fontName.replace(/[^a-zA-Z0-9]/g, '')}Font;
`;

    // Write the output file
    fs.writeFileSync(outputPath, fontModule);

    console.log(`✅ Font converted successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Original size: ${(fontBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📊 Base64 size: ${(base64Font.length / 1024).toFixed(2)} KB`);

    return {
      fontName: fontName.replace(/[^a-zA-Z0-9]/g, ''),
      base64: base64Font,
      originalSize: fontBuffer.length,
      base64Size: base64Font.length
    };

  } catch (error) {
    console.error(`❌ Font conversion failed:`, error.message);
    throw error;
  }
}

/**
 * Create a complete font loader for jsPDF
 */
function createFontLoader(fontInfo, outputPath) {
  const loaderCode = `/**
 * Font loader for jsPDF with Unicode support
 * Font: ${fontInfo.fontName}
 */

import jsPDF from 'jspdf';
import { ${fontInfo.fontName}Font } from './${fontInfo.fontName}.js';

/**
 * Add Unicode font to jsPDF instance
 */
export function addUnicodeFont(doc: jsPDF): void {
  // Add font to VFS
  doc.addFileToVFS('${fontInfo.fontName}.ttf', ${fontInfo.fontName}Font);

  // Register font
  doc.addFont('${fontInfo.fontName}.ttf', '${fontInfo.fontName}', 'normal');

  // Set as default font for Unicode support
  doc.setFont('${fontInfo.fontName}');
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
`;

  fs.writeFileSync(outputPath, loaderCode);
  console.log(`✅ Font loader created: ${outputPath}`);
}

// Main execution if run directly
if (require.main === module) {
  const fontPath = path.join(__dirname, 'NotoSans-Regular.ttf');
  const outputPath = path.join(__dirname, 'NotoSansRegular.js');
  const loaderPath = path.join(__dirname, 'unicode-font-loader.ts');

  if (!fs.existsSync(fontPath)) {
    console.error('❌ Font file not found:', fontPath);
    process.exit(1);
  }

  try {
    const fontInfo = convertTTFToBase64(fontPath, outputPath);
    createFontLoader(fontInfo, loaderPath);
    console.log('🎉 Font conversion completed successfully!');
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

module.exports = { convertTTFToBase64, createFontLoader };