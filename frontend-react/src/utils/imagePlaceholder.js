/**
 * Utility to generate local placeholder images instead of using external services
 * This avoids reliance on external placeholder image services that may be unstable
 */

/**
 * Generates a data URI for a placeholder image with specified text
 * @param {string} text - Text to display on the placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height (defaults to width if not provided)
 * @param {string} bgColor - Background color in hex format
 * @param {string} textColor - Text color in hex format
 * @returns {string} - Data URI for the placeholder image
 */
export const getPlaceholderImage = (
  text = '',
  width = 150, 
  height = 0,
  bgColor = 'eeeeee', 
  textColor = '333333'
) => {
  // If height not provided, make it square
  const finalHeight = height || width;
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = finalHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = `#${bgColor}`;
  ctx.fillRect(0, 0, width, finalHeight);
  
  // Draw text
  const displayText = text || `${width}x${finalHeight}`;
  ctx.fillStyle = `#${textColor}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate font size based on canvas dimensions
  const fontSize = Math.max(10, Math.min(width / 10, finalHeight / 8));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  
  // Handle multiline text if needed
  if (text.length > 15) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      if (testLine.length <= 15) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (finalHeight - totalTextHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });
  } else {
    ctx.fillText(displayText, width / 2, finalHeight / 2);
  }
  
  // Return data URI
  return canvas.toDataURL('image/png');
};

/**
 * Creates a simple colored box with text as a fallback for when 
 * canvas might not be available
 * 
 * @param {string} text - Text to display
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @returns {string} - SVG data URI
 */
export const getSimplePlaceholder = (text = '', width = 150, height = 150) => {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#eeeeee" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#333333" text-anchor="middle" dominant-baseline="middle">
        ${text || `${width}x${height}`}
      </text>
    </svg>
  `;
  
  // Convert SVG to a data URI
  const encodedSvg = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encodedSvg}`;
};

/**
 * Default placeholder function that tries canvas first, then falls back to SVG
 */
export const getImagePlaceholder = (text, width, height, bgColor, textColor) => {
  try {
    return getPlaceholderImage(text, width, height, bgColor, textColor);
  } catch (error) {
    console.warn('Canvas placeholder failed, using SVG fallback', error);
    return getSimplePlaceholder(text, width, height);
  }
};

export default getImagePlaceholder;
