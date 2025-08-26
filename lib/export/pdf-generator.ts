/**
 * PDF document generation for message exports with Unicode support
 */

import jsPDF from 'jspdf';
import { logger } from '@/lib/logger';
import { NotoSansRegularFont } from '@/lib/fonts/NotoSansRegular';

export interface MessageExportData {
  messageId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  sessionName: string;
  agentUsed?: string;
  tags?: string[];
}

export interface PDFGenerationOptions {
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeBranding?: boolean;
  fontSize?: number;
  margin?: number;
}

/**
 * Generate a professionally formatted PDF from message data
 */
export async function generateMessagePDF(
  messageData: MessageExportData,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  try {
    const {
      includeMetadata = true,
      includeTimestamp = true,
      includeBranding = true,
      fontSize = 11,
      margin = 20
    } = options;

    logger.info('Generating PDF document', {
      component: 'PDFGenerator',
      messageId: messageData.messageId,
      sessionName: messageData.sessionName
    });

    // Create new PDF document with Unicode support
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add Unicode font support
    doc.addFileToVFS('NotoSansRegular.ttf', NotoSansRegularFont);
    doc.addFont('NotoSansRegular.ttf', 'NotoSansRegular', 'normal');
    doc.setFont('NotoSansRegular', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // Branding header removed per user request

    // Session Information section removed per user request

    // Modern content presentation with contemporary typography
    doc.setFontSize(fontSize);
    doc.setFont('NotoSansRegular', 'normal');
    doc.setTextColor(31, 41, 55); // Modern slate gray (#1f2937)

    // Add clean top spacing
    yPosition += 8;

    // Render markdown content with enhanced styling
    yPosition = await renderMarkdownContent(doc, messageData.content, margin, yPosition, contentWidth, pageHeight, fontSize);

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('NotoSansRegular', 'normal');
      doc.setTextColor(108, 117, 125);

      const footerText = `Page ${i} of ${pageCount}`;
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
    }

    // Convert to buffer with proper encoding handling
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    logger.info('PDF generation completed', {
      component: 'PDFGenerator',
      messageId: messageData.messageId,
      pdfSize: pdfBuffer.length,
      pageCount
    });

    return pdfBuffer;

  } catch (error) {
    logger.error('PDF generation failed', {
      component: 'PDFGenerator',
      messageId: messageData.messageId
    }, error);

    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Render markdown content with proper styling in PDF
 */
async function renderMarkdownContent(
  doc: jsPDF,
  content: string,
  margin: number,
  startY: number,
  contentWidth: number,
  pageHeight: number,
  baseFontSize: number
): Promise<number> {
  let yPosition = startY;

  // Normalize Unicode content
  const normalizedContent = content.normalize('NFC');

  // Split content into lines for processing
  const lines = normalizedContent.split('\n');

  let inCodeBlock = false;
  let codeBlockContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we need a new page
    if (yPosition > pageHeight - margin - 30) {
      doc.addPage();
      yPosition = margin;
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render it
        yPosition = renderCodeBlock(doc, codeBlockContent, margin, yPosition, contentWidth, baseFontSize);
        codeBlockContent = '';
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        yPosition += 5; // Add space before code block
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Handle headers
    if (line.startsWith('###')) {
      yPosition = renderHeader(doc, line.replace(/^###\s*/, ''), margin, yPosition, 3, baseFontSize);
    } else if (line.startsWith('##')) {
      yPosition = renderHeader(doc, line.replace(/^##\s*/, ''), margin, yPosition, 2, baseFontSize);
    } else if (line.startsWith('#')) {
      yPosition = renderHeader(doc, line.replace(/^#\s*/, ''), margin, yPosition, 1, baseFontSize);
    }
    // Handle horizontal rules
    else if (line.trim() === '---' || line.trim() === '***') {
      yPosition = renderHorizontalRule(doc, margin, yPosition, contentWidth);
    }
    // Handle lists
    else if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
      yPosition = renderListItem(doc, line, margin, yPosition, contentWidth, baseFontSize);
    }
    // Handle regular paragraphs
    else if (line.trim() !== '') {
      yPosition = renderParagraph(doc, line, margin, yPosition, contentWidth, baseFontSize);
    }
    // Handle empty lines
    else {
      yPosition += baseFontSize * 0.3; // Consistent space for empty lines
    }
  }

  return yPosition;
}

/**
 * Render a markdown header with enhanced styling and visual hierarchy
 */
function renderHeader(doc: jsPDF, text: string, margin: number, yPosition: number, level: number, baseFontSize: number): number {
  const headerSizes = {
    1: baseFontSize + 7, // H1: +7pt for more prominence
    2: baseFontSize + 5, // H2: +5pt  
    3: baseFontSize + 3  // H3: +3pt
  };

  const headerColors = {
    1: [15, 23, 42],     // Modern slate-900 for H1 (#0f172a)
    2: [30, 41, 59],     // Modern slate-800 for H2 (#1e293b)
    3: [51, 65, 85]      // Modern slate-700 for H3 (#334155)
  };

  // Professional spacing before headers
  yPosition += baseFontSize * (level === 1 ? 0.8 : 0.6);

  // Add modern background highlight for H1
  if (level === 1) {
    doc.setFillColor(241, 245, 249); // Modern slate-50 background (#f1f5f9)
    doc.rect(margin - 4, yPosition - headerSizes[1] * 0.35, 
             doc.internal.pageSize.getWidth() - (margin * 2) + 8, 
             headerSizes[1] * 0.9, 'F');
  }

  // Set header styling
  doc.setFontSize(headerSizes[level as keyof typeof headerSizes]);
  doc.setFont('NotoSansRegular', 'normal');
  doc.setTextColor(...(headerColors[level as keyof typeof headerColors] as [number, number, number]));

  // Enhanced bold effect for headers
  const cleanText = formatInlineMarkdown(text);
  doc.text(cleanText, margin, yPosition);
  doc.text(cleanText, margin + 0.15, yPosition); // Stronger bold effect
  doc.text(cleanText, margin + 0.08, yPosition - 0.08); // Additional bold layer

  // Add decorative underline for H1 and H2
  if (level <= 2) {
    const textWidth = doc.getTextWidth(cleanText);
    doc.setLineWidth(level === 1 ? 1 : 0.5);
    doc.setDrawColor(...(headerColors[level as keyof typeof headerColors] as [number, number, number]));
    doc.line(margin, yPosition + 2, margin + textWidth, yPosition + 2);
  }

  // Balanced spacing after headers
  yPosition += headerSizes[level as keyof typeof headerSizes] * 0.4 + (level === 1 ? 8 : 6);

  return yPosition;
}

/**
 * Render a code block with enhanced styling and visual appeal
 */
function renderCodeBlock(doc: jsPDF, code: string, margin: number, yPosition: number, contentWidth: number, baseFontSize: number): number {
  // Modern code block design with contemporary colors
  doc.setFillColor(248, 250, 252); // Clean slate-50 background (#f8fafc)
  doc.setDrawColor(226, 232, 240); // Modern slate-200 border (#e2e8f0)

  const codeLines = code.trim().split('\n');
  const lineHeight = (baseFontSize - 1) * 0.35; // Balanced line spacing for code blocks
  const padding = 8;
  const blockHeight = codeLines.length * lineHeight + (padding * 2);

  // Modern clean design without shadows
  doc.setFillColor(248, 250, 252); // Clean background
  doc.setLineWidth(1);
  doc.rect(margin - 3, yPosition - 2, contentWidth + 6, blockHeight, 'FD');

  // Add modern left accent for code blocks
  doc.setFillColor(99, 102, 241); // Modern indigo-500 accent (#6366f1)
  doc.rect(margin - 3, yPosition - 2, 3, blockHeight, 'F');

  // Modern code font styling
  doc.setFontSize(baseFontSize - 1);
  doc.setFont('NotoSansRegular', 'normal');
  doc.setTextColor(30, 41, 59); // Modern slate-800 for code (#1e293b)

  // Render each line of code with better formatting
  let codeY = yPosition + padding;
  codeLines.forEach((line, index) => {
    // Add line numbers for longer code blocks with modern styling
    if (codeLines.length > 5) {
      doc.setTextColor(148, 163, 184); // Modern slate-400 for line numbers (#94a3b8)
      doc.setFontSize(baseFontSize - 2);
      const lineNumber = (index + 1).toString().padStart(2, ' ');
      doc.text(lineNumber, margin - 1, codeY);
      
      doc.setTextColor(30, 41, 59); // Back to slate-800 for code
      doc.setFontSize(baseFontSize - 1);
      doc.text(line, margin + 10, codeY);
    } else {
      doc.text(line, margin + 2, codeY); // Small indent for cleaner look
    }
    codeY += lineHeight;
  });

  return yPosition + blockHeight + 10; // Increased spacing after code blocks
}

/**
 * Render a horizontal rule
 */
function renderHorizontalRule(doc: jsPDF, margin: number, yPosition: number, contentWidth: number): number {
  yPosition += 10;

  // Modern subtle divider with gradient effect
  doc.setDrawColor(226, 232, 240); // Modern slate-200 (#e2e8f0)
  doc.setLineWidth(1);
  doc.line(margin, yPosition, margin + contentWidth, yPosition);

  return yPosition + 10;
}

/**
 * Render a list item with proper indentation
 */
function renderListItem(doc: jsPDF, line: string, margin: number, yPosition: number, contentWidth: number, baseFontSize: number): number {
  // Calculate indentation level
  const indentMatch = line.match(/^(\s*)/);
  const indentLevel = Math.floor((indentMatch ? indentMatch[1].length : 0) / 2);
  const indent = margin + (indentLevel * 12);

  // Extract bullet/number and text
  const bulletMatch = line.match(/^\s*[-*+]\s+(.*)/) || line.match(/^\s*\d+\.\s+(.*)/);
  const text = bulletMatch ? bulletMatch[1] : line.trim();

  // Modern list styling
  doc.setFontSize(baseFontSize);
  doc.setFont('NotoSansRegular', 'normal');
  doc.setTextColor(31, 41, 55); // Modern slate-700 (#1f2937)

  // Add bullet point
  const bullet = line.match(/^\s*\d+\./) ? '•' : '•';
  doc.text(bullet, indent, yPosition);

  // Add text content
  const textLines = doc.splitTextToSize(formatInlineMarkdown(text), contentWidth - (indent - margin) - 8);
  let textY = yPosition;

  textLines.forEach((textLine: string) => {
    doc.text(textLine, indent + 8, textY);
    textY += baseFontSize * 0.3; // Consistent list item spacing
  });

  return textY + 1; // Minimal spacing after list items
}

/**
 * Render a regular paragraph with enhanced formatting and visual appeal
 */
function renderParagraph(doc: jsPDF, text: string, margin: number, yPosition: number, contentWidth: number, baseFontSize: number): number {
  doc.setFontSize(baseFontSize);
  doc.setFont('NotoSansRegular', 'normal');
  doc.setTextColor(31, 41, 55); // Modern slate-700 for body text (#1f2937)

  const formattedText = formatInlineMarkdown(text);
  const lines = doc.splitTextToSize(formattedText, contentWidth);

  // Professional single-spaced line spacing
  const lineHeight = baseFontSize * 0.3; // Balanced line spacing for professional single-space look

  lines.forEach((line: string, index: number) => {
    // Add subtle indentation for continuation lines in long paragraphs
    const lineMargin = (index > 0 && lines.length > 3) ? margin + 2 : margin;
    doc.text(line, lineMargin, yPosition);
    yPosition += lineHeight;
  });

  return yPosition + (baseFontSize * 0.4); // Balanced paragraph spacing for professional layout
}

/**
 * Process inline markdown formatting (bold, italic, code)
 */
function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold (remove markers for now)
    .replace(/\*(.*?)\*/g, '$1')     // Italic (remove markers for now)
    .replace(/`(.*?)`/g, '$1')       // Inline code (remove markers for now)
    .replace(/[""]|"|"/g, '"')       // Smart quotes
    .replace(/['']|'|'/g, "'")       // Smart apostrophes
    .replace(/—/g, '--')             // Em dash
    .replace(/–/g, '-')              // En dash
    .replace(/…/g, '...')            // Ellipsis
    .replace(/\u00A0/g, ' ');        // Non-breaking space
}

/**
 * Generate PDF with syntax highlighting for code content
 */
export async function generateCodePDF(
  messageData: MessageExportData,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  // For now, use the standard PDF generator
  // TODO: Add syntax highlighting support with different fonts/colors
  return generateMessagePDF(messageData, {
    ...options,
    fontSize: 9, // Smaller font for code
  });
}

/**
 * Extract and format message content for PDF with Unicode support
 */
export function formatMessageForPDF(content: string): string {
  // Normalize Unicode characters (NFC normalization)
  let formatted = content.normalize('NFC');

  // Remove HTML tags if present
  formatted = formatted.replace(/<[^>]*>/g, '');

  // Convert markdown-style formatting to plain text
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;
  const inlineCodeRegex = /`(.*?)`/g;
  const codeBlockRegex = /```[\s\S]*?```/g;

  formatted = formatted
    .replace(boldRegex, '$1') // Bold
    .replace(italicRegex, '$1') // Italic
    .replace(inlineCodeRegex, '$1') // Inline code
    .replace(codeBlockRegex, (match) => {
      // Code blocks - preserve formatting
      return match.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '');
    });

  // Handle problematic characters that might not render well
  formatted = formatted
    .replace(/[""]|"|"/g, '"') // Smart quotes to regular quotes
    .replace(/['']|'|'/g, "'") // Smart apostrophes to regular apostrophes
    .replace(/—/g, '--') // Em dash to double dash
    .replace(/–/g, '-') // En dash to regular dash
    .replace(/…/g, '...') // Ellipsis to three dots
    .replace(/\u00A0/g, ' '); // Non-breaking space to regular space

  return formatted;
}