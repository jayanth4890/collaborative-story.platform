const PDFDocument = require('pdfkit');

/**
 * Generates a PDF of the completed story and streams it to the client response.
 * @param {Object} story - The story object with populated author and contributors.
 * @param {Object} res - Express response object.
 */
const generateStoryPDF = (story, res) => {
  const doc = new PDFDocument({
    margin: 50,
    bufferPages: true,
  });

  // Set response headers for PDF download
  const filename = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_story.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe the PDF document to the response stream
  doc.pipe(res);

  // --- HEADER SECTION ---
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(story.title, { align: 'center' })
    .moveDown(0.5);

  // Author details
  const authorName = story.author ? story.author.username : 'Unknown Author';
  doc
    .fontSize(14)
    .font('Helvetica-Oblique')
    .text(`Written by: ${authorName}`, { align: 'center' })
    .moveDown(0.5);

  // Contributors details
  if (story.contributors && story.contributors.length > 0) {
    const contributorNames = story.contributors.map((c) => c.username).join(', ');
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#4B5563') // Gray 600 color
      .text(`Contributors: ${contributorNames}`, { align: 'center' })
      .moveDown(1.5);
  } else {
    doc.moveDown(1.5);
  }

  // Draw a horizontal rule
  doc
    .moveTo(50, doc.y)
    .lineTo(562, doc.y)
    .strokeColor('#E5E7EB') // Gray 200 color
    .stroke()
    .moveDown(2);

  // --- CONTENT SECTION ---
  doc.fillColor('#1F2937'); // Gray 800 for body text

  if (story.content && story.content.trim() !== '') {
    // Convert HTML tags to plain text line breaks
    let textContent = story.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/blockquote>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n');

    // Strip remaining HTML tags
    textContent = textContent.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    textContent = textContent
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const paragraphs = textContent.split('\n');
    
    paragraphs.forEach((para) => {
      const trimmedPara = para.trim();
      if (trimmedPara !== '') {
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(trimmedPara, {
            align: 'justify',
            lineGap: 4,
            paragraphGap: 10,
          });
      }
    });
  } else {
    doc
      .fontSize(12)
      .font('Helvetica-Oblique')
      .fillColor('#9CA3AF') // Gray 400
      .text('This story is empty.', { align: 'center' });
  }

  // --- PAGE NUMBERING ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    
    // Bottom footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text(
        `Page ${i + 1} of ${range.count}`,
        50,
        750,
        {
          align: 'center',
          width: 512,
        }
      );
  }

  // Finalize the PDF file
  doc.end();
};

module.exports = { generateStoryPDF };
