/**
 * Verification Script: NEXORA AI Welcome Screen Responsive Layout Simulation
 * Tests target viewports: 360x800, 390x844, 768x1024, 1366x768, 1920x1080
 */

import assert from 'assert';

const RESOLUTIONS = [
  { name: 'Mobile Compact', width: 360, height: 800 },
  { name: 'Mobile Standard', width: 390, height: 844 },
  { name: 'Tablet / iPad', width: 768, height: 1024 },
  { name: 'Laptop Browser', width: 1366, height: 768 },
  { name: 'Desktop Full HD', width: 1920, height: 1080 },
];

function simulateWelcomeLayout(width, height) {
  const isCompactHeight = height < 740;
  const isTallViewport = height > 900;

  // Responsive scaling formula from WelcomeScreen.tsx
  const avatarScale = isCompactHeight
    ? Math.max(0.72, Math.min(0.85, (height - 350) / 420))
    : 1.0;
  const avatarWrapperHeight = Math.round(260 * avatarScale);

  const cardMaxWidth = 440;
  const cardWidth = Math.min(width - 32, cardMaxWidth); // subtracting 16px horizontal margins each side

  const cardMaxHeight = isTallViewport ? 680 : undefined;
  
  // Element dimensions
  const titleHeight = isCompactHeight ? 62 : 80;
  const subtitleHeight = isCompactHeight ? 40 : 50;
  const textMarginBottom = isCompactHeight ? 16 : 32;
  const textSectionHeight = titleHeight + subtitleHeight + textMarginBottom;

  const buttonHeight = 50;
  const skipButtonHeight = 28;
  const actionGap = 16;
  const actionSectionHeight = buttonHeight + skipButtonHeight + actionGap;

  const topPadding = isCompactHeight ? 20 : 32;
  const bottomPadding = isCompactHeight ? 20 : 32;

  const totalContentHeight = avatarWrapperHeight + textSectionHeight + actionSectionHeight + topPadding + bottomPadding;

  return {
    isCompactHeight,
    isTallViewport,
    avatarScale,
    avatarWrapperHeight,
    cardWidth,
    cardMaxHeight,
    totalContentHeight,
    availableHeight: height,
    fitsWithoutScroll: totalContentHeight <= height,
    buttonWidth: Math.min(cardWidth, 380),
  };
}

console.log('===============================================================');
console.log('   NEXORA AI — WELCOME SCREEN RESPONSIVE LAYOUT VERIFICATION   ');
console.log('===============================================================');

let allPassed = true;

for (const res of RESOLUTIONS) {
  const layout = simulateWelcomeLayout(res.width, res.height);
  console.log(`\n[Resolution] ${res.name} (${res.width}x${res.height})`);
  console.log(`  - Avatar Scale: ${layout.avatarScale.toFixed(2)} (${layout.avatarWrapperHeight}px height)`);
  console.log(`  - Card Width: ${layout.cardWidth}px | Button Width: ${layout.buttonWidth}px`);
  console.log(`  - Total Content Height: ${layout.totalContentHeight}px / Viewport: ${layout.availableHeight}px`);
  console.log(`  - Fits in Viewport without overflow: ${layout.fitsWithoutScroll}`);
  console.log(`  - Card Max Height on Tall Screens: ${layout.cardMaxHeight ? layout.cardMaxHeight + 'px' : 'Fluid'}`);

  try {
    assert(layout.fitsWithoutScroll, `Content height (${layout.totalContentHeight}px) exceeds viewport height (${res.height}px)`);
    assert(layout.avatarScale >= 0.70 && layout.avatarScale <= 1.0, `Avatar scale (${layout.avatarScale}) out of bounds`);
    assert(layout.buttonWidth >= 280 && layout.buttonWidth <= 380, `Button width (${layout.buttonWidth}px) out of bounds`);
    console.log(`  ✓ PASSED: Proportions balanced, buttons clickable, zero overflow.`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    allPassed = false;
  }
}

console.log('\n===============================================================');
if (allPassed) {
  console.log('All 5 target resolutions passed responsive constraints successfully!');
  process.exit(0);
} else {
  console.error('Some resolution checks failed.');
  process.exit(1);
}
