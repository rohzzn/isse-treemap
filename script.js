// Global state
const state = {
  data: [],
  view: 'treemap', // 'treemap', 'year', or 'month'
  year: 2022,
  month: 0, // 0-based (January is 0)
  selectedDay: null,
  selectedMonthIndex: null,
  selectedCategory: null,
  selectedContributor: null, // Added for drill-down
  selectedFeatures: [],
  yearRange: { min: 2022, max: 2024 },
  treemapLevel: 'category', // 'category', 'contributor', 'quarter' or 'quarter-category'
  treemapMode: 'category', // 'category' or 'quarter'
  selectedQuarter: null, // For quarter drill-down
  treemapHistory: [] // Stack to track treemap navigation history
};

// Category colors - refined color palette for better cohesion
const categoryColors = {
  'Meeting': '#F5A623',       // Warm orange
  'Chat features': '#4A90E2',  // Bright blue
  'Contact Center features': '#5E7F9A', // Steel blue
  'General features': '#63A375', // Forest green
  'Mail and Calendar features': '#7B68EE', // Medium slate blue
  'Phone features': '#607D8B', // Blue grey
  'Team Chat features': '#3F51B5', // Indigo
  'Webinar features': '#8BC34A', // Light green
  'Whiteboard features': '#00BCD4', // Cyan
  'Zoom Apps features': '#009688', // Teal
  'Zoom Clips': '#9C27B0',    // Purple
  'Zoom Clips features': '#673AB7', // Deep purple
  'Zoom Mail and Calendar': '#2196F3', // Blue
  
  // Original colors for specific categories
  'UI/UX': '#1E88E5',         // Blue
  'Security': '#EF5350',       // Red
  'Performance': '#43A047',    // Green
  'API': '#26A69A',            // Teal
  'Admin Controls': '#9C27B0', // Purple
  'Integration': '#3949AB',    // Indigo
  'Audio/Video': '#00ACC1',    // Cyan
  'Chat': '#E91E63',           // Pink
  'Whiteboard': '#8BC34A',     // Light Green
  'Mobile': '#FFA726',         // Orange
  'Desktop': '#607D8B',        // Blue Grey
  'Cloud Storage': '#00BCD4',  // Teal
  'Calendar': '#FFEB3B',       // Yellow
  'Background': '#9E9E9E',     // Grey
  'Analytics': '#F44336',      // Red
  'Settings': '#4527A0',       // Deep Purple
  'Recording': '#F57F17',      // Amber
  'Search': '#FFA000',         // Amber
  'Notifications': '#EF6C00',  // Orange
  'Uncategorized': '#78909C',  // Blue Grey Light
  
  // Team colors for contributor view
  'Frontend': '#42A5F5',       // Blue
  'Backend': '#66BB6A',        // Green
  'Mobile': '#FFA726',         // Orange
  'Design': '#EC407A',         // Pink
  'Security': '#EF5350',       // Red
  'QA': '#AB47BC',             // Purple
  'Infrastructure': '#5C6BC0', // Indigo
  'API': '#26A69A',            // Teal
  'DevOps': '#8D6E63',         // Brown
  'Research': '#78909C'        // Blue Grey  
};

// Normalized category color map for case-insensitive matching
const normalizedCategoryColors = {};

// DOM elements
const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  
  // View buttons
  treemapViewBtn: document.getElementById('treemapViewBtn'),
  yearViewBtn: document.getElementById('yearViewBtn'),
  backToYearBtn: document.getElementById('backToYearBtn'),
  
  // Treemap view
  treemapView: document.getElementById('treemapView'),
  treemapContainer: document.getElementById('treemapContainer'),
  categoryDetails: document.getElementById('categoryDetails'),
  categoryLegend: document.getElementById('categoryLegend'),
  treemapToggleGroup: document.getElementById('treemapToggleGroup'),
  categoryModeBtn: document.getElementById('categoryModeBtn'),
  quarterModeBtn: document.getElementById('quarterModeBtn'),
  
  // Month view
  monthlyView: document.getElementById('monthlyView'),
  monthYearLabel: document.getElementById('monthYearLabel'),
  monthlyGrid: document.getElementById('monthlyGrid'),
  dayFeaturesList: document.getElementById('dayFeaturesList'),
  
  // Year view
  yearlyView: document.getElementById('yearlyView'),
  yearLabel: document.getElementById('yearLabel'),
  prevYearBtn: document.getElementById('prevYearBtn'),
  nextYearBtn: document.getElementById('nextYearBtn'),
  yearlyGrid: document.getElementById('yearlyGrid'),
  monthFeaturesList: document.getElementById('monthFeaturesList'),
  
  // Metrics
  totalFeatures: document.getElementById('totalFeatures'),
  avgReleaseSize: document.getElementById('avgReleaseSize'),
  releaseCadence: document.getElementById('releaseCadence'),
  totalReleases: document.getElementById('totalReleases'),
  featureVelocity: document.getElementById('featureVelocity'),
  velocityTrend: document.getElementById('velocityTrend'),
  
  // Summary
  quarterStats: document.getElementById('quarterStats'),
  categoryStats: document.getElementById('categoryStats')
};

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const shortMonthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Date range constraint
const DATE_RANGE = {
  start: new Date(2022, 0, 1), // Jan 1, 2022
  end: new Date(2024, 0, 31)   // Jan 31, 2024
};

// Initialize the application
async function init() {
  try {
    // Show loading overlay
    elements.loadingOverlay.classList.remove('hidden');
    
    // Initialize normalized category colors
    initializeNormalizedColors();
    
    // Load data
    await loadData();
    
    // Determine year range from data
    determineYearRange();
    
    // Setup event listeners
    setupEventListeners();
    
    // Generate category legend
    generateCategoryLegend();
    
    // Calculate release metrics
    calculateReleaseMetrics();
    
    // Initial render
    updateUI();
    
    // Hide loading overlay
    elements.loadingOverlay.classList.add('hidden');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to initialize the application. Please check the console for details.');
  }
}

// Initialize normalized colors
function initializeNormalizedColors() {
  // Create normalized map for case-insensitive matching
  Object.keys(categoryColors).forEach(category => {
    normalizedCategoryColors[normalizeText(category)] = categoryColors[category];
  });
}

// Normalize text for consistent matching
function normalizeText(text) {
  if (!text) return '';
  return text.trim().toLowerCase();
}

// Get color for a category with normalization
function getCategoryColor(category) {
  if (!category) return '#78909C'; // Default color
  
  // Try direct match first
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  
  // Try normalized match
  const normalizedKey = normalizeText(category);
  return normalizedCategoryColors[normalizedKey] || '#78909C';
}

// Determine year range from data
function determineYearRange() {
  if (state.data.length === 0) {
    state.yearRange = { min: 2022, max: 2024 }; // Default range
    return;
  }
  
  const years = state.data.map(item => item.year);
  state.yearRange = {
    min: Math.min(...years),
    max: Math.max(...years)
  };
  
  console.log(`Determined year range: ${state.yearRange.min} to ${state.yearRange.max}`);
}

// Load Excel data
async function loadData() {
  try {
    // Load Zoom data
    const zoomData = await fetchExcel('data/Zoom.xlsx');
    state.data = processReleaseData(zoomData);
    
    console.log('Data loaded successfully', state.data);
  } catch (error) {
    console.error('Error loading data:', error);
    throw new Error('Failed to load Excel data');
  }
}

// Fetch and parse Excel file
async function fetchExcel(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { cellDates: true });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error(`Error fetching Excel file ${url}:`, error);
    throw error;
  }
}

// Process release data from Excel
function processReleaseData(data) {
  // Process and normalize categories
  const processedData = data.map(item => {
    const releaseDate = new Date(item["Release Date"]);
    
    // Extract and normalize category
    let category = (item["Group / Category"] || "Uncategorized").trim();
    
    // Merge similar categories (optional)
    if (category.toLowerCase().includes('meeting')) {
      category = 'Meeting'; // Standardize meeting-related categories
    }
    
    return {
      date: releaseDate,
      year: releaseDate.getFullYear(),
      month: releaseDate.getMonth(),
      day: releaseDate.getDate(),
      description: item["Feature Description"],
      category: category,
      impact: getImpactLevel(item["Feature Description"]),
      team: getTeam(item),
      contributor: getContributor(item), // Add contributor info for drill-down
      bugCount: getBugCount(item),
      complexity: getComplexityLevel(item), // Add complexity metrics
      timeToRelease: getTimeToRelease(item), // Add time to release metrics
      dependencies: getDependencies(item) // Add dependency information
    };
  });
  
  // Filter to only include data in the specified date range
  return processedData.filter(item => {
    const date = new Date(item.date);
    return date >= DATE_RANGE.start && date <= DATE_RANGE.end;
  });
}

// Extract team information 
function getTeam(item) {
  // For demonstration - in a real app this would pull from actual data
  const teams = ['Frontend', 'Backend', 'Mobile', 'Security', 'Infrastructure', 'Design', 'API', 'QA', 'DevOps'];
  return teams[Math.floor(Math.random() * teams.length)];
}

// Extract contributor information (individual engineer)
function getContributor(item) {
  // For demonstration - in a real app this would pull from actual data
  const contributors = [
    'Sarah Chen', 'Michael Johnson', 'Amit Patel', 'Jessica Kim',
    'Carlos Rodriguez', 'Emma Thompson', 'David Wilson', 'Olga Petrov',
    'Marcus Lee', 'Hannah Garcia', 'James Moore', 'Fatima Ali',
    'Ryan Taylor', 'Sophia Martinez', 'Noah Anderson', 'Wei Zhang'
  ];
  return contributors[Math.floor(Math.random() * contributors.length)];
}

// Extract bug count
function getBugCount(item) {
  // In a real implementation, this would pull from actual bug data
  return Math.floor(Math.random() * 5);
}

// Determine complexity level based on description and other factors
function getComplexityLevel(item) {
  const complexityLevels = ['Low', 'Medium', 'High'];
  return complexityLevels[Math.floor(Math.random() * 3)];
}

// Get time to release (days from feature development to release)
function getTimeToRelease(item) {
  // In a real implementation, this would be calculated from actual timeline data
  return Math.floor(Math.random() * 30 + 10); // 10-40 days
}

// Get feature dependencies
function getDependencies(item) {
  // In a real implementation, this would list actual dependencies
  const allDependencies = ['API', 'Authentication', 'Database', 'Frontend', 'Notifications', 'Payments'];
  const count = Math.floor(Math.random() * 3); // 0-2 dependencies
  
  // Randomly select 'count' dependencies
  const dependencies = [];
  for (let i = 0; i < count; i++) {
    const dep = allDependencies[Math.floor(Math.random() * allDependencies.length)];
    if (!dependencies.includes(dep)) {
      dependencies.push(dep);
    }
  }
  
  return dependencies;
}

// Determine impact level based on description
function getImpactLevel(description) {
  const lowImpactKeywords = ['minor', 'small', 'fix', 'tweak'];
  const highImpactKeywords = ['major', 'significant', 'new', 'revolutionary', 'transform'];
  
  if (!description) return 'Medium';
  
  const descLower = description.toLowerCase();
  
  for (const keyword of highImpactKeywords) {
    if (descLower.includes(keyword)) {
      return 'High';
    }
  }
  
  for (const keyword of lowImpactKeywords) {
    if (descLower.includes(keyword)) {
      return 'Low';
    }
  }
  
  return 'Medium'; // Default impact level
}

// Setup event listeners
function setupEventListeners() {
  // View switchers
  elements.treemapViewBtn.addEventListener('click', () => {
    state.view = 'treemap';
    state.treemapLevel = state.treemapMode; // Reset to top level when switching to treemap
    state.selectedDay = null;
    state.selectedMonthIndex = null;
    state.selectedFeatures = [];
    state.selectedCategory = null;
    state.selectedContributor = null;
    state.selectedQuarter = null;
    state.treemapHistory = [];
    updateUI();
    
    // Show treemap toggle
    showTreemapToggle(true);
  });
  
  elements.yearViewBtn.addEventListener('click', () => {
    state.view = 'year';
    state.selectedMonthIndex = null;
    state.selectedCategory = null;
    state.selectedContributor = null;
    state.selectedQuarter = null;
    state.selectedFeatures = [];
    updateUI();
    
    // Hide treemap toggle
    showTreemapToggle(false);
  });
  
  elements.backToYearBtn.addEventListener('click', () => {
    state.view = 'year';
    state.selectedDay = null;
    state.selectedFeatures = [];
    updateUI();
  });
  
  // Year navigation
  elements.prevYearBtn.addEventListener('click', () => {
    if (state.year > state.yearRange.min) {
      state.year--;
      state.selectedMonthIndex = null;
      state.selectedFeatures = [];
      updateUI();
    }
  });
  
  elements.nextYearBtn.addEventListener('click', () => {
    if (state.year < state.yearRange.max) {
      state.year++;
      state.selectedMonthIndex = null;
      state.selectedFeatures = [];
      updateUI();
    }
  });
  
  // Add treemap navigation event listener (back button)
  document.addEventListener('keydown', (e) => {
    // Go back on Escape key when in treemap and not at top level
    if (e.key === 'Escape' && state.view === 'treemap' && 
        (state.treemapLevel !== 'category' && state.treemapLevel !== 'quarter')) {
      navigateTreemapUp();
    }
  });
  
  // Treemap mode buttons
  elements.categoryModeBtn.addEventListener('click', () => {
    if (state.treemapMode !== 'category') {
      state.treemapMode = 'category';
      state.treemapLevel = 'category'; // Reset to top level
      state.selectedCategory = null;
      state.selectedContributor = null;
      state.selectedQuarter = null;
      state.selectedFeatures = [];
      state.treemapHistory = [];
      updateActiveButtons();
      renderTreemapView();
      generateCategoryLegend(); // Update legend
    }
  });
  
  elements.quarterModeBtn.addEventListener('click', () => {
    if (state.treemapMode !== 'quarter') {
      state.treemapMode = 'quarter';
      state.treemapLevel = 'quarter'; // Reset to top level
      state.selectedCategory = null;
      state.selectedContributor = null;
      state.selectedQuarter = null;
      state.selectedFeatures = [];
      state.treemapHistory = [];
      updateActiveButtons();
      renderTreemapView();
      generateCategoryLegend(); // Update legend
    }
  });
  
  // Track window resize for treemap updates
  window.addEventListener('resize', () => {
    if (state.view === 'treemap') {
      renderTreemapView();
    }
  });
  
  // Initialize treemap toggle visibility
  showTreemapToggle(state.view === 'treemap');
}

// Update active state of buttons
function updateActiveButtons() {
  // View buttons
  elements.treemapViewBtn.classList.toggle('active', state.view === 'treemap');
  elements.yearViewBtn.classList.toggle('active', state.view === 'year');
  
  // Treemap mode buttons
  elements.categoryModeBtn.classList.toggle('active', state.treemapMode === 'category');
  elements.quarterModeBtn.classList.toggle('active', state.treemapMode === 'quarter');
}

// Show/hide treemap toggle
function showTreemapToggle(show) {
  if (show) {
    elements.treemapToggleGroup.classList.add('visible');
  } else {
    elements.treemapToggleGroup.classList.remove('visible');
  }
}

// Navigate up in the treemap hierarchy
function navigateTreemapUp() {
  if (state.treemapMode === 'category') {
    if (state.treemapLevel === 'contributor') {
      state.treemapLevel = 'category';
      state.selectedContributor = null;
      state.selectedCategory = null;
    }
  } else if (state.treemapMode === 'quarter') {
    if (state.treemapLevel === 'quarter-category') {
      state.treemapLevel = 'quarter';
      state.selectedCategory = null;
      state.selectedQuarter = null;
    }
  }
  
  // Re-render the treemap
  renderTreemapView();
  
  // Update legend
  generateCategoryLegend();
}

// Get all release dates (used for metrics calculation)
function getReleaseDates() {
  const dates = {};
  
  state.data.forEach(feature => {
    const dateStr = feature.date.toISOString().split('T')[0];
    dates[dateStr] = true;
  });
  
  return Object.keys(dates).map(dateStr => new Date(dateStr)).sort((a, b) => a - b);
}

// Calculate average days between releases
function calculateAverageReleaseInterval(dates) {
  if (dates.length < 2) return 14; // Default to bi-weekly if not enough data
  
  let totalDays = 0;
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = Math.floor((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
    totalDays += daysDiff;
  }
  
  return Math.max(Math.round(totalDays / (dates.length - 1)), 7); // Minimum 7 days
}

// Calculate release metrics
function calculateReleaseMetrics() {
  const releaseDates = getReleaseDates();
  
  // Total features
  elements.totalFeatures.textContent = state.data.length;
  
  // Average release size
  const avgSize = state.data.length / Math.max(releaseDates.length, 1);
  elements.avgReleaseSize.textContent = avgSize.toFixed(1) + ' features';
  
  // Release cadence
  const avgInterval = calculateAverageReleaseInterval(releaseDates);
  elements.releaseCadence.textContent = avgInterval + ' days';
  
  // Total releases
  elements.totalReleases.textContent = releaseDates.length;
  
  // Feature velocity (features per month)
  const startDate = new Date(Math.min(...state.data.map(f => f.date)));
  const endDate = new Date(Math.max(...state.data.map(f => f.date)));
  const monthsInRange = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
  
  const velocity = state.data.length / monthsInRange;
  elements.featureVelocity.textContent = velocity.toFixed(1) + '/month';
  
  // Generate velocity trend chart
  generateVelocityTrend();
}

// Generate a velocity trend chart
function generateVelocityTrend() {
  // Group data by month
  const monthlyData = {};
  
  state.data.forEach(feature => {
    const yearMonth = `${feature.year}-${String(feature.month + 1).padStart(2, '0')}`;
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = 0;
    }
    monthlyData[yearMonth]++;
  });
  
  // Convert to array and sort
  const sortedMonths = Object.keys(monthlyData).sort();
  
  // Find max value for scaling
  const maxValue = Math.max(...Object.values(monthlyData));
  
  // Generate chart HTML
  let chartHTML = '<div class="trend-bars">';
  
  sortedMonths.forEach(month => {
    const height = (monthlyData[month] / maxValue) * 100;
    chartHTML += `<div class="trend-bar" style="height: ${height}%;" title="${month}: ${monthlyData[month]} features"></div>`;
  });
  
  chartHTML += '</div>';
  elements.velocityTrend.innerHTML = chartHTML;
}

// Update the UI based on current state
function updateUI() {
  // Update active buttons
  updateActiveButtons();
  
  // Update view visibility
  updateViewVisibility();
  
  // Update month/year labels
  elements.monthYearLabel.textContent = `${monthNames[state.month]} ${state.year}`;
  elements.yearLabel.textContent = state.year.toString();
  
  // Render appropriate view
  if (state.view === 'treemap') {
    renderTreemapView();
  } else if (state.view === 'year') {
    renderYearView();
  } else if (state.view === 'month') {
    renderMonthView();
  }
  
  // Update summary statistics
  renderSummaryStats();
  
  // Update category legend based on current treemap level
  generateCategoryLegend();
}

// Update view visibility
function updateViewVisibility() {
  elements.treemapView.classList.toggle('hidden', state.view !== 'treemap');
  elements.yearlyView.classList.toggle('hidden', state.view !== 'year');
  elements.monthlyView.classList.toggle('hidden', state.view !== 'month');
}

// Squarified treemap algorithm
// Based on the paper "Squarified Treemaps" by Mark Bruls, Kees Huizing, and Jarke J. van Wijk
function squarifyTreemap(data, container) {
  // Clear container
  container.innerHTML = '';
  
  // Get container dimensions
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // Determine treemap title based on current mode and level
  let treemapTitle = '';
  let backButtonNeeded = false;
  
  if (state.treemapMode === 'category') {
    if (state.treemapLevel === 'category') {
      treemapTitle = 'Feature Categories';
    } else if (state.treemapLevel === 'contributor') {
      treemapTitle = `Contributors for ${state.selectedCategory}`;
      backButtonNeeded = true;
    }
  } else if (state.treemapMode === 'quarter') {
    if (state.treemapLevel === 'quarter') {
      treemapTitle = 'Features by Quarter';
    } else if (state.treemapLevel === 'quarter-category') {
      treemapTitle = `Categories in ${state.selectedQuarter}`;
      backButtonNeeded = true;
    }
  }
  
  // Create title for the treemap
  const title = document.createElement('div');
  title.className = 'treemap-title';
  title.textContent = treemapTitle;
  container.appendChild(title);
  
  // Add back button if needed
  if (backButtonNeeded) {
    const backBtn = document.createElement('button');
    backBtn.className = 'treemap-back-btn';
    backBtn.textContent = state.treemapMode === 'category' ? 'Back to Categories' : 'Back to Quarters';
    backBtn.addEventListener('click', navigateTreemapUp);
    container.appendChild(backBtn);
  }
  
  // Create treemap container div with specific height for the actual treemap
  const treemapDiv = document.createElement('div');
  treemapDiv.className = 'treemap-content';
  container.appendChild(treemapDiv);
  
  // Apply squarified algorithm
  const availableHeight = containerHeight - 50; // Adjust for title
  squarify(data, treemapDiv, 0, 0, containerWidth, availableHeight);
}

// Squarify algorithm implementation 
function squarify(items, container, x, y, width, height) {
  // Make a copy of the items array to avoid modifying the original
  const sortedItems = [...items].sort((a, b) => b.value - a.value);
  
  // Calculate the total value
  const total = sortedItems.reduce((sum, item) => sum + item.value, 0);
  
  // Call layout function to start layout process
  layoutRow(sortedItems, container, x, y, width, height, total);
}

// Layout items in the container
function layoutRow(items, container, x, y, width, height, total) {
  // If no items, return
  if (items.length === 0) return;
  
  // Choose the orientation (horizontal or vertical)
  // Use the shorter dimension for row
  const isVertical = width > height;
  const shortSide = isVertical ? height : width;
  
  // Scale factor - how much area represents one unit
  const scale = (width * height) / total;
  
  // Compute row with best aspect ratio
  const row = [];
  let remainingItems = [...items];
  let remainingTotal = total;
  let rowTotal = 0;
  
  // Build a row until aspect ratio worsens
  let bestAspectRatio = Infinity;
  
  while (remainingItems.length > 0) {
    // Add next item to row
    const item = remainingItems[0];
    row.push(item);
    rowTotal += item.value;
    
    // Calculate aspect ratio
    const rowScale = scale * rowTotal;
    const rowWidth = isVertical ? width : (rowScale / shortSide);
    const rowHeight = isVertical ? (rowScale / width) : height;
    
    // Calculate the max/min aspect ratio in the row
    let minArea = Infinity;
    let maxArea = 0;
    let sumOfSquaredAreas = 0;
    
    for (const rowItem of row) {
      const itemScale = scale * rowItem.value;
      const itemWidth = isVertical ? (itemScale / rowHeight) : rowWidth;
      const itemHeight = isVertical ? rowHeight : (itemScale / rowWidth);
      const aspect = Math.max(itemWidth / itemHeight, itemHeight / itemWidth);
      
      minArea = Math.min(minArea, itemWidth * itemHeight);
      maxArea = Math.max(maxArea, itemWidth * itemHeight);
      sumOfSquaredAreas += (itemWidth * itemHeight) * (itemWidth * itemHeight);
    }
    
    // Calculate the current aspect ratio
    const currentAspectRatio = maxArea / minArea;
    
    // If this is the first item, or the aspect ratio improves, continue
    if (row.length === 1 || currentAspectRatio < bestAspectRatio) {
      bestAspectRatio = currentAspectRatio;
      remainingItems.shift();
      remainingTotal -= item.value;
    } else {
      // Aspect ratio worsened, revert and break
      row.pop();
      rowTotal -= item.value;
      break;
    }
    
    // If we've used all items, break
    if (remainingItems.length === 0) break;
  }
  
  // Layout the current row
  layoutItems(row, container, x, y, width, height, rowTotal, total, isVertical);
  
  // Calculate the new position and dimension for the next row
  if (remainingItems.length > 0) {
    if (isVertical) {
      // If vertical, next row is to the right
      const rowWidth = rowTotal * width / total;
      squarify(remainingItems, container, x + rowWidth, y, width - rowWidth, height, remainingTotal);
    } else {
      // If horizontal, next row is below
      const rowHeight = rowTotal * height / total;
      squarify(remainingItems, container, x, y + rowHeight, width, height - rowHeight, remainingTotal);
    }
  }
}

// Layout items within a row
function layoutItems(row, container, x, y, width, height, rowTotal, total, isVertical) {
  // Calculate dimensions for this row
  let rowWidth, rowHeight;
  
  if (isVertical) {
    // For vertical layout, row spans full height
    rowWidth = (rowTotal / total) * width;
    rowHeight = height;
  } else {
    // For horizontal layout, row spans full width
    rowWidth = width;
    rowHeight = (rowTotal / total) * height;
  }
  
  // Track position within row
  let currentPosition = 0;
  
  // Position items within the row
  for (const item of row) {
    let itemWidth, itemHeight, itemX, itemY;
    
    if (isVertical) {
      // For vertical layout, items are stacked vertically
      itemWidth = rowWidth;
      itemHeight = (item.value / rowTotal) * rowHeight;
      itemX = x;
      itemY = y + currentPosition;
      currentPosition += itemHeight;
    } else {
      // For horizontal layout, items are arranged horizontally
      itemWidth = (item.value / rowTotal) * rowWidth;
      itemHeight = rowHeight;
      itemX = x + currentPosition;
      itemY = y;
      currentPosition += itemWidth;
    }
    
    // Create the cell
    createTreemapCell(item, container, itemX, itemY, itemWidth, itemHeight);
  }
}

// Create an individual treemap cell
function createTreemapCell(item, container, x, y, width, height) {
  const cell = document.createElement('div');
  cell.className = 'treemap-cell';
  cell.style.position = 'absolute';
  cell.style.left = `${x}px`;
  cell.style.top = `${y}px`;
  cell.style.width = `${width}px`;
  cell.style.height = `${height}px`;
  cell.style.backgroundColor = item.color;
  
  // Add tooltip for hover information
  cell.setAttribute('title', `${item.label}: ${item.value}`);
  
  // Check if cell is large enough to fit text
  const isCellLarge = width > 60 && height > 40;
  
  if (isCellLarge) {
    // Add text for label and value
    const label = document.createElement('div');
    label.className = 'treemap-label';
    
    // Create label text
    const labelText = document.createElement('div');
    labelText.className = 'treemap-label-text';
    labelText.textContent = item.label;
    
    // Create value text
    const valueText = document.createElement('div');
    valueText.className = 'treemap-value-text';
    valueText.textContent = item.value;
    
    // Add label and value to cell
    label.appendChild(labelText);
    label.appendChild(valueText);
    cell.appendChild(label);
  }
  
  // Add click handler based on current treemap mode and level
  cell.addEventListener('click', () => {
    if (state.treemapMode === 'category') {
      if (state.treemapLevel === 'category') {
        handleCategoryClick(item.label);
      } else if (state.treemapLevel === 'contributor') {
        handleContributorClick(item.label);
      }
    } else if (state.treemapMode === 'quarter') {
      if (state.treemapLevel === 'quarter') {
        handleQuarterClick(item.label);
      } else if (state.treemapLevel === 'quarter-category') {
        handleQuarterCategoryClick(item.label);
      }
    }
  });
  
  container.appendChild(cell);
}

// Render treemap view
function renderTreemapView() {
  // Clear container first
  elements.treemapContainer.innerHTML = '';
  
  // Determine what data to use based on treemap level and mode
  let treemapData;
  
  if (state.treemapMode === 'category') {
    // Category mode
    if (state.treemapLevel === 'category') {
      treemapData = getCategoryTreemapData();
    } else if (state.treemapLevel === 'contributor') {
      treemapData = getContributorTreemapData(state.selectedCategory);
    }
  } else {
    // Quarter mode
    if (state.treemapLevel === 'quarter') {
      treemapData = getQuarterTreemapData();
    } else if (state.treemapLevel === 'quarter-category') {
      treemapData = getQuarterCategoryTreemapData(state.selectedQuarter);
    }
  }
  
  // Render the squarified treemap
  squarifyTreemap(treemapData, elements.treemapContainer);
  
  // Update details based on the current state
  if (state.treemapMode === 'category') {
    if (state.treemapLevel === 'category' && state.selectedCategory) {
      renderCategoryDetails();
    } else if (state.treemapLevel === 'contributor' && state.selectedContributor) {
      renderContributorDetails();
    } else {
      elements.categoryDetails.classList.add('hidden');
    }
  } else {
    if (state.treemapLevel === 'quarter' && state.selectedQuarter) {
      renderQuarterDetails();
    } else if (state.treemapLevel === 'quarter-category' && state.selectedCategory) {
      renderQuarterCategoryDetails();
    } else {
      elements.categoryDetails.classList.add('hidden');
    }
  }
}

// Get data for category treemap
function getCategoryTreemapData() {
  // Count features by category
  const categoryCount = {};
  
  state.data.forEach(feature => {
    const category = feature.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  // Convert to array for treemap
  return Object.entries(categoryCount).map(([category, count]) => ({
    label: category,
    value: count,
    color: getCategoryColor(category)
  }));
}

// Get data for contributor treemap (when a category is selected)
function getContributorTreemapData(selectedCategory) {
  // Filter features by selected category
  const categoryFeatures = state.data.filter(
    feature => feature.category === selectedCategory
  );
  
  // Count features by team
  const teamCount = {};
  
  categoryFeatures.forEach(feature => {
    const team = feature.team;
    teamCount[team] = (teamCount[team] || 0) + 1;
  });
  
  // Convert to array for treemap
  return Object.entries(teamCount).map(([team, count]) => ({
    label: team,
    value: count,
    color: getCategoryColor(team) // Reuse category colors for teams
  }));
}

// Handle category click in treemap (for drill-down)
function handleCategoryClick(category) {
  if (state.treemapLevel === 'category') {
    // Update state for drill-down
    state.selectedCategory = category;
    state.treemapLevel = 'contributor';
    state.selectedContributor = null;
    state.selectedFeatures = state.data.filter(
      feature => feature.category === category
    );
    
    // Hide details panel during drill-down
    elements.categoryDetails.classList.add('hidden');
    
    // Render the contributor-level treemap
    renderTreemapView();
    
    // Update legend
    generateCategoryLegend();
  }
}

// Handle contributor click in treemap
function handleContributorClick(contributor) {
  if (state.treemapLevel === 'contributor') {
    state.selectedContributor = contributor;
    state.selectedFeatures = state.data.filter(
      feature => feature.category === state.selectedCategory && feature.team === contributor
    );
    
    renderContributorDetails();
  }
}

// Calculate category metrics
function calculateCategoryMetrics(features) {
  // Calculate time to release
  const avgTimeToRelease = Math.round(
    features.reduce((sum, feature) => sum + feature.timeToRelease, 0) / features.length
  );
  
  // Calculate bug count
  const totalBugs = features.reduce((sum, feature) => sum + feature.bugCount, 0);
  
  // Calculate team contributions
  const teamContributions = {};
  features.forEach(feature => {
    if (!teamContributions[feature.team]) {
      teamContributions[feature.team] = 0;
    }
    teamContributions[feature.team]++;
  });
  
  // Get top contributors
  const topContributors = Object.entries(teamContributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  return {
    avgTimeToRelease,
    totalBugs,
    teamContributions,
    topContributors,
    bugRatio: features.length > 0 ? (totalBugs / features.length).toFixed(1) : 0
  };
}

// Render category details
function renderCategoryDetails() {
  // Update container visibility
  elements.categoryDetails.classList.remove('hidden');
  
  // Calculate metrics
  const metrics = calculateCategoryMetrics(state.selectedFeatures);
  
  // Get category color
  const categoryColor = getCategoryColor(state.selectedCategory);
  
  // Create category details
  elements.categoryDetails.innerHTML = `
    <div class="category-details-header">
      <h4 class="category-title" style="color: ${categoryColor}">
        ${state.selectedCategory} Features
      </h4>
      <div class="category-actions">
        <span class="category-count">
          ${state.selectedFeatures.length} feature${state.selectedFeatures.length !== 1 ? 's' : ''}
        </span>
        <button id="drillDownBtn" class="drill-down-btn">
          Show Contributors
        </button>
      </div>
    </div>
    
    <div class="category-metrics">
      <div class="metric-card">
        <div class="metric-card-label">Avg Time to Release</div>
        <div class="metric-card-value">${metrics.avgTimeToRelease} days</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Total Bugs</div>
        <div class="metric-card-value">${metrics.totalBugs} (${metrics.bugRatio}/feature)</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Top Contributors</div>
        <div class="metric-card-value">
          ${metrics.topContributors.map(([team, count]) => `${team} (${count})`).join(', ')}
        </div>
      </div>
    </div>
    
    <div class="category-features-list" id="categoryFeatures">
      ${state.selectedFeatures.length > 0 ? '' : '<p class="no-features">No features found for this category</p>'}
    </div>
  `;
  
  // Add drill-down button event listener
  document.getElementById('drillDownBtn').addEventListener('click', () => {
    // Change to contributor view
    state.treemapLevel = 'contributor';
    state.selectedContributor = null;
    
    // Hide details panel during drill-down
    elements.categoryDetails.classList.add('hidden');
    
    // Render the contributor-level treemap
    renderTreemapView();
  });
  
  // Get container for feature items
  const featuresContainer = document.getElementById('categoryFeatures');
  
  if (featuresContainer && state.selectedFeatures.length > 0) {
    // Sort features by date (newest first)
    const sortedFeatures = [...state.selectedFeatures].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    
    // Add feature items
    sortedFeatures.forEach(feature => {
      const featureItem = document.createElement('div');
      featureItem.className = 'feature-item';
      
      const featureHeader = document.createElement('div');
      featureHeader.className = 'feature-header';
      
      // Impact indicator
      const impactIndicator = document.createElement('span');
      impactIndicator.className = `impact-label impact-${feature.impact.toLowerCase()}`;
      impactIndicator.textContent = feature.impact;
      featureHeader.appendChild(impactIndicator);
      
      // Team indicator
      const teamIndicator = document.createElement('span');
      teamIndicator.className = 'team-label';
      teamIndicator.textContent = feature.team;
      featureHeader.appendChild(teamIndicator);
      
      // Date
      const dateDisplay = document.createElement('span');
      dateDisplay.className = 'feature-date';
      dateDisplay.textContent = new Date(feature.date).toLocaleDateString();
      featureHeader.appendChild(dateDisplay);
      
      featureItem.appendChild(featureHeader);
      
      // Description
      const description = document.createElement('p');
      description.className = 'feature-description';
      description.textContent = feature.description;
      
      // Feature metadata
      const metadata = document.createElement('div');
      metadata.className = 'feature-metadata';
      metadata.innerHTML = `
        <span class="metadata-item">Bug Count: ${feature.bugCount}</span>
        <span class="metadata-item">Time to Release: ${feature.timeToRelease} days</span>
        <span class="metadata-item">Complexity: ${feature.complexity}</span>
      `;
      
      // Dependencies if available
      if (feature.dependencies && feature.dependencies.length > 0) {
        const depElement = document.createElement('span');
        depElement.className = 'metadata-item dependencies';
        depElement.innerHTML = `Dependencies: ${feature.dependencies.join(', ')}`;
        metadata.appendChild(depElement);
      }
      
      featureItem.appendChild(description);
      featureItem.appendChild(metadata);
      featuresContainer.appendChild(featureItem);
    });
  }
}

// Render contributor details
function renderContributorDetails() {
  // Update container visibility
  elements.categoryDetails.classList.remove('hidden');
  
  // Calculate metrics
  const metrics = calculateCategoryMetrics(state.selectedFeatures);
  
  // Get contributor color
  const contributorColor = getCategoryColor(state.selectedContributor);
  
  // Create contributor details
  elements.categoryDetails.innerHTML = `
    <div class="category-details-header">
      <h4 class="category-title" style="color: ${contributorColor}">
        ${state.selectedContributor} (${state.selectedCategory})
      </h4>
      <span class="category-count">
        ${state.selectedFeatures.length} feature${state.selectedFeatures.length !== 1 ? 's' : ''}
      </span>
    </div>
    
    <div class="category-metrics">
      <div class="metric-card">
        <div class="metric-card-label">Avg Time to Release</div>
        <div class="metric-card-value">${metrics.avgTimeToRelease} days</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Total Bugs</div>
        <div class="metric-card-value">${metrics.totalBugs} (${metrics.bugRatio}/feature)</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Primary Category</div>
        <div class="metric-card-value">${state.selectedCategory}</div>
      </div>
    </div>
    
    <div class="category-features-list" id="contributorFeatures">
      ${state.selectedFeatures.length > 0 ? '' : '<p class="no-features">No features found for this contributor</p>'}
    </div>
  `;
  
  // Get container for feature items
  const featuresContainer = document.getElementById('contributorFeatures');
  
  if (featuresContainer && state.selectedFeatures.length > 0) {
    // Sort features by date (newest first)
    const sortedFeatures = [...state.selectedFeatures].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    
    // Add feature items
    sortedFeatures.forEach(feature => {
      const featureItem = document.createElement('div');
      featureItem.className = 'feature-item';
      
      const featureHeader = document.createElement('div');
      featureHeader.className = 'feature-header';
      
      // Category indicator
      const categoryTag = document.createElement('span');
      categoryTag.className = 'feature-category';
      categoryTag.textContent = feature.category;
      const categoryColor = getCategoryColor(feature.category);
      categoryTag.style.backgroundColor = `${categoryColor}20`; // 20% opacity
      categoryTag.style.color = categoryColor;
      featureHeader.appendChild(categoryTag);
      
      // Impact indicator
      const impactIndicator = document.createElement('span');
      impactIndicator.className = `impact-label impact-${feature.impact.toLowerCase()}`;
      impactIndicator.textContent = feature.impact;
      featureHeader.appendChild(impactIndicator);
      
      // Date
      const dateDisplay = document.createElement('span');
      dateDisplay.className = 'feature-date';
      dateDisplay.textContent = new Date(feature.date).toLocaleDateString();
      featureHeader.appendChild(dateDisplay);
      
      featureItem.appendChild(featureHeader);
      
      // Description
      const description = document.createElement('p');
      description.className = 'feature-description';
      description.textContent = feature.description;
      
      // Feature metadata
      const metadata = document.createElement('div');
      metadata.className = 'feature-metadata';
      metadata.innerHTML = `
        <span class="metadata-item">Bug Count: ${feature.bugCount}</span>
        <span class="metadata-item">Time to Release: ${feature.timeToRelease} days</span>
        <span class="metadata-item">Complexity: ${feature.complexity}</span>
      `;
      
      featureItem.appendChild(description);
      featureItem.appendChild(metadata);
      featuresContainer.appendChild(featureItem);
    });
  }
}

// Generate category legend
function generateCategoryLegend() {
  elements.categoryLegend.innerHTML = '';
  
  // Add legend title based on current view
  const legendTitle = document.createElement('div');
  legendTitle.className = 'legend-title';
  
  // Set appropriate title based on treemap mode and level
  if (state.treemapMode === 'category') {
    if (state.treemapLevel === 'category') {
      legendTitle.textContent = 'Feature Categories';
    } else if (state.treemapLevel === 'contributor') {
      legendTitle.textContent = 'Teams';
    }
  } else if (state.treemapMode === 'quarter') {
    if (state.treemapLevel === 'quarter') {
      legendTitle.textContent = 'Quarters';
    } else if (state.treemapLevel === 'quarter-category') {
      legendTitle.textContent = `Categories in ${state.selectedQuarter}`;
    }
  }
  
  elements.categoryLegend.appendChild(legendTitle);
  
  // Determine which legend to show based on treemap mode and level
  const isQuarterMode = state.treemapMode === 'quarter';
  
  if (isQuarterMode && state.treemapLevel === 'quarter') {
    // For quarter mode at top level, show quarter legend
    const quarterColors = {
      'Q1': '#4A90E2', // Blue
      'Q2': '#43A047', // Green
      'Q3': '#F5A623', // Orange
      'Q4': '#EF5350'  // Red
    };
    
    Object.entries(quarterColors).forEach(([quarter, color]) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      
      const colorSwatch = document.createElement('div');
      colorSwatch.className = 'legend-color';
      colorSwatch.style.backgroundColor = color;
      
      const itemName = document.createElement('span');
      itemName.className = 'legend-label';
      itemName.textContent = quarter;
      
      legendItem.appendChild(colorSwatch);
      legendItem.appendChild(itemName);
      
      elements.categoryLegend.appendChild(legendItem);
    });
    
    return;
  }
  
  // Get unique items to show in legend
  const items = {};
  
  if (state.treemapLevel === 'contributor' || state.treemapLevel === 'quarter-category') {
    // For contributor level or quarter-category level, show all teams
    state.data.forEach(feature => {
      items[feature.team] = true;
    });
  } else {
    // For category level, show all categories
    state.data.forEach(feature => {
      items[feature.category] = true;
    });
  }
  
  // Create legend items
  Object.keys(items).sort().forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const color = getCategoryColor(item);
    
    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'legend-color';
    colorSwatch.style.backgroundColor = color;
    
    const itemName = document.createElement('span');
    itemName.className = 'legend-label';
    itemName.textContent = item;
    
    legendItem.appendChild(colorSwatch);
    legendItem.appendChild(itemName);
    
    // Add click handler for filtering (only in treemap view)
    if (state.view === 'treemap') {
      legendItem.addEventListener('click', () => {
        if (state.treemapMode === 'category') {
          if (state.treemapLevel === 'contributor') {
            // Filter by team at contributor level
            filterTreemapByTeam(item);
          } else if (state.treemapLevel === 'category') {
            // Filter by category at category level
            handleCategoryClick(item);
          }
        } else if (state.treemapMode === 'quarter') {
          if (state.treemapLevel === 'quarter-category') {
            // Filter by category at quarter-category level
            handleQuarterCategoryClick(item);
          }
        }
      });
    }
    
    elements.categoryLegend.appendChild(legendItem);
  });
}

// Filter treemap by team
function filterTreemapByTeam(team) {
  // Set filter
  state.selectedTeam = team;
  
  // Re-render treemap with team filter
  renderTreemapView();
}

// Render year view
function renderYearView() {
  // Clear grid
  elements.yearlyGrid.innerHTML = '';
  
  // Process monthly data
  const monthlyFeatures = [];
  for (let month = 0; month < 12; month++) {
    monthlyFeatures[month] = getFeaturesForMonth(month);
  }
  
  // Create month cards
  for (let month = 0; month < 12; month++) {
    const features = monthlyFeatures[month];
    
    // Count features by category
    const categoryCount = {};
    features.forEach(feature => {
      const category = feature.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Create month card
    const monthCard = document.createElement('div');
    monthCard.className = 'month-card';
    
    // Add selected class if this month is selected
    if (month === state.selectedMonthIndex) {
      monthCard.classList.add('selected');
    }
    
    // Month header
    const header = document.createElement('div');
    header.className = 'month-header';
    
    const monthName = document.createElement('span');
    monthName.className = 'month-name';
    monthName.textContent = shortMonthNames[month];
    
    const featureCount = document.createElement('span');
    featureCount.className = 'month-count';
    featureCount.textContent = features.length;
    
    header.appendChild(monthName);
    header.appendChild(featureCount);
    monthCard.appendChild(header);
    
    // Month grid (simplified from the detailed calendar logic)
    const monthGrid = document.createElement('div');
    monthGrid.className = 'month-grid';
    
    // Group features by week
    const weeklyData = {};
    features.forEach(feature => {
      const date = new Date(feature.date);
      const weekNum = Math.floor(date.getDate() / 7);
      
      if (!weeklyData[weekNum]) {
        weeklyData[weekNum] = { count: 0, categories: {} };
      }
      
      weeklyData[weekNum].count++;
      const category = feature.category;
      
      if (!weeklyData[weekNum].categories[category]) {
        weeklyData[weekNum].categories[category] = 0;
      }
      weeklyData[weekNum].categories[category]++;
    });
    
    // Find max count for scaling
    const maxCount = Math.max(1, ...Object.values(weeklyData).map(week => week.count));
    
    // Create week cells
    for (let week = 0; week < 5; week++) {
      const weekData = weeklyData[week] || { count: 0, categories: {} };
      
      // Get primary category for this week (for color)
      let primaryCategory = 'Uncategorized';
      let maxCategoryCount = 0;
      
      Object.entries(weekData.categories).forEach(([category, count]) => {
        if (count > maxCategoryCount) {
          maxCategoryCount = count;
          primaryCategory = category;
        }
      });
      
      const intensity = weekData.count / maxCount;
      const color = getCategoryColor(primaryCategory);
      const bgcolor = intensity > 0 
        ? `rgba(${hexToRgb(color)}, ${Math.min(0.2 + intensity * 0.8, 1)})`
        : 'white';
      
      const weekCell = document.createElement('div');
      weekCell.className = 'week-cell';
      weekCell.style.backgroundColor = bgcolor;
      
      if (weekData.count > 0) {
        weekCell.textContent = weekData.count;
      }
      
      monthGrid.appendChild(weekCell);
    }
    
    monthCard.appendChild(monthGrid);
    
    // Month footer with category indicators
    if (features.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'month-footer';
      
      // Show top 3 categories
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([category, count]) => {
          const categoryIndicator = document.createElement('div');
          categoryIndicator.className = 'month-category-count';
          
          const categoryDot = document.createElement('span');
          categoryDot.className = 'month-category-dot';
          categoryDot.style.backgroundColor = getCategoryColor(category);
          
          categoryIndicator.appendChild(categoryDot);
          categoryIndicator.appendChild(document.createTextNode(count));
          categoryIndicator.title = category;
          footer.appendChild(categoryIndicator);
        });
      
      monthCard.appendChild(footer);
    }
    
    // Click handler to navigate to month view
    monthCard.addEventListener('click', () => {
      state.month = month;
      state.view = 'month';
      state.selectedDay = null;
      state.selectedFeatures = [];
      updateUI();
    });
    
    elements.yearlyGrid.appendChild(monthCard);
  }
  
  // Hide month features list in year view
  elements.monthFeaturesList.classList.add('hidden');
}

// Render month view
function renderMonthView() {
  // Get calendar data
  const calendarData = generateCalendarData();
  
  // Clear grid
  elements.monthlyGrid.innerHTML = '';
  
  // Add day headers
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  daysOfWeek.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.textContent = day;
    elements.monthlyGrid.appendChild(dayHeader);
  });
  
  // Calculate first day of month and days in month
  const firstDayOfMonth = new Date(state.year, state.month, 1).getDay();
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  
  // Find maximum value for scaling color intensity
  const maxValue = Math.max(
    1, // minimum to avoid division by zero
    ...Object.values(calendarData).map(day => day.count)
  );
  
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    elements.monthlyGrid.appendChild(emptyCell);
  }
  
  // Add cells for each day in month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = calendarData[day] || { count: 0, categories: {} };
    
    // Get primary category for this day (for color)
    let primaryCategory = 'Uncategorized';
    let maxCategoryCount = 0;
    
    Object.entries(dayData.categories).forEach(([category, count]) => {
      if (count > maxCategoryCount) {
        maxCategoryCount = count;
        primaryCategory = category;
      }
    });
    
    const intensity = dayData.count / maxValue;
    const color = getCategoryColor(primaryCategory);
    const bgcolor = intensity > 0 
      ? `rgba(${hexToRgb(color)}, ${Math.min(0.2 + intensity * 0.8, 1)})`
      : 'white';
    
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.style.backgroundColor = bgcolor;
    
    // Add selected class if this day is selected
    if (day === state.selectedDay) {
      dayCell.classList.add('selected');
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);
    
    // Feature count
    if (dayData.count > 0) {
      const dayCount = document.createElement('div');
      dayCount.className = 'day-count';
      dayCount.textContent = dayData.count;
      dayCell.appendChild(dayCount);
      
      // Category indicators
      if (Object.keys(dayData.categories).length > 0) {
        const indicators = document.createElement('div');
        indicators.className = 'day-indicators';
        
        // Show dots for top 3 categories
        Object.entries(dayData.categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([category]) => {
            const dot = document.createElement('span');
            dot.className = 'category-indicator-dot';
            dot.style.backgroundColor = getCategoryColor(category);
            dot.title = category;
            indicators.appendChild(dot);
          });
        
        dayCell.appendChild(indicators);
      }
    }
    
    // Click handler
    dayCell.addEventListener('click', () => {
      handleDayClick(day);
    });
    
    elements.monthlyGrid.appendChild(dayCell);
  }
  
  // Update day features list
  if (state.selectedDay !== null) {
    renderDayFeatures();
  } else {
    elements.dayFeaturesList.classList.add('hidden');
  }
}

// Generate calendar data for current month
function generateCalendarData() {
  const calendar = {};
  
  // Count features by date and category
  state.data.forEach(feature => {
    const date = feature.date;
    
    // Skip if date is not in selected year/month
    if (date.getFullYear() !== state.year || date.getMonth() !== state.month) {
      return;
    }
    
    const day = date.getDate();
    const category = feature.category || 'Uncategorized';
    
    if (!calendar[day]) {
      calendar[day] = { count: 0, categories: {} };
    }
    
    calendar[day].count++;
    
    if (!calendar[day].categories[category]) {
      calendar[day].categories[category] = 0;
    }
    calendar[day].categories[category]++;
  });
  
  return calendar;
}

// Handle day click in month view
function handleDayClick(day) {
  if (state.selectedDay === day) {
    // Clear selection if clicking the same day again
    state.selectedDay = null;
    state.selectedFeatures = [];
    elements.dayFeaturesList.classList.add('hidden');
  } else {
    state.selectedDay = day;
    state.selectedFeatures = getFeaturesForDay(day);
    renderDayFeatures();
  }
  
  // Re-render the month view to update selected state
  renderMonthView();
}

// Get features for a specific day
function getFeaturesForDay(day) {
  const exactDate = new Date(state.year, state.month, day);
  const dateStr = exactDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  // Function to filter features by exact date
  const filterByExactDate = (feature) => {
    if (!feature.date) return false;
    const featureDate = new Date(feature.date);
    return featureDate.toISOString().split('T')[0] === dateStr;
  };
  
  return state.data.filter(filterByExactDate);
}

// Get features for a specific month
function getFeaturesForMonth(month) {
  // Filter function for month
  const filterByMonth = (feature) => {
    if (!feature.date) return false;
    const featureDate = new Date(feature.date);
    return featureDate.getFullYear() === state.year && featureDate.getMonth() === month;
  };
  
  return state.data.filter(filterByMonth);
}

// Render day features
function renderDayFeatures() {
  // Update container visibility
  elements.dayFeaturesList.classList.remove('hidden');
  
  // Calculate metrics for this day's features
  const metrics = calculateCategoryMetrics(state.selectedFeatures);
  
  // Create features list
  elements.dayFeaturesList.innerHTML = `
    <div class="features-header">
      <h4 class="features-title">
        Features Released on ${monthNames[state.month]} ${state.selectedDay}, ${state.year}
      </h4>
      <span class="features-count">
        ${state.selectedFeatures.length} feature${state.selectedFeatures.length !== 1 ? 's' : ''}
      </span>
    </div>
    
    <div class="category-metrics">
      <div class="metric-card">
        <div class="metric-card-label">Total Features</div>
        <div class="metric-card-value">${state.selectedFeatures.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Total Bugs</div>
        <div class="metric-card-value">${metrics.totalBugs}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Top Contributors</div>
        <div class="metric-card-value">
          ${metrics.topContributors.map(([team, count]) => `${team} (${count})`).join(', ')}
        </div>
      </div>
    </div>
    
    <div class="features-list" id="dayFeatureItems">
      ${state.selectedFeatures.length > 0 ? '' : '<p class="no-features">No features released on this day</p>'}
    </div>
  `;
  
  // Get container for feature items
  const featuresContainer = document.getElementById('dayFeatureItems');
  
  // Add feature items
  state.selectedFeatures.forEach(feature => {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    
    const featureHeader = document.createElement('div');
    featureHeader.className = 'feature-header';
    
    // Category indicator
    const categoryTag = document.createElement('span');
    categoryTag.className = 'feature-category';
    categoryTag.textContent = feature.category;
    const categoryColor = getCategoryColor(feature.category);
    categoryTag.style.backgroundColor = `${categoryColor}20`; // 20% opacity
    categoryTag.style.color = categoryColor;
    featureHeader.appendChild(categoryTag);
    
    // Impact indicator
    const impactIndicator = document.createElement('span');
    impactIndicator.className = `impact-label impact-${feature.impact.toLowerCase()}`;
    impactIndicator.textContent = feature.impact;
    featureHeader.appendChild(impactIndicator);
    
    // Team indicator
    const teamIndicator = document.createElement('span');
    teamIndicator.className = 'team-label';
    teamIndicator.textContent = feature.team;
    featureHeader.appendChild(teamIndicator);
    
    featureItem.appendChild(featureHeader);
    
    // Description
    const description = document.createElement('p');
    description.className = 'feature-description';
    description.textContent = feature.description;
    
    // Feature metadata
    const metadata = document.createElement('div');
    metadata.className = 'feature-metadata';
    metadata.innerHTML = `
      <span class="metadata-item">Bug Count: ${feature.bugCount}</span>
      <span class="metadata-item">Time to Release: ${feature.timeToRelease} days</span>
      <span class="metadata-item">Complexity: ${feature.complexity}</span>
    `;
    
    // Dependencies if available
    if (feature.dependencies && feature.dependencies.length > 0) {
      const depElement = document.createElement('span');
      depElement.className = 'metadata-item dependencies';
      depElement.innerHTML = `Dependencies: ${feature.dependencies.join(', ')}`;
      metadata.appendChild(depElement);
    }
    
    featureItem.appendChild(description);
    featureItem.appendChild(metadata);
    featuresContainer.appendChild(featureItem);
  });
}

// Render summary statistics
function renderSummaryStats() {
  // Update quarter stats
  elements.quarterStats.innerHTML = '';
  
  // Group features by quarter
  const quarterData = {};
  state.data.forEach(feature => {
    const year = feature.year;
    const quarter = Math.floor(feature.month / 3) + 1;
    const key = `${year} Q${quarter}`;
    
    if (!quarterData[key]) {
      quarterData[key] = 0;
    }
    
    quarterData[key]++;
  });
  
  // Create quarter bars
  Object.entries(quarterData)
    .sort((a, b) => {
      // Sort by year then quarter
      const [yearA, quarterA] = a[0].split(' ');
      const [yearB, quarterB] = b[0].split(' ');
      return yearA === yearB 
        ? quarterA.localeCompare(quarterB) 
        : yearA.localeCompare(yearB);
    })
    .forEach(([quarter, count]) => {
      const quarterBar = document.createElement('div');
      quarterBar.className = 'quarter-bar';
      
      const quarterLabel = document.createElement('span');
      quarterLabel.className = 'quarter-label';
      quarterLabel.textContent = quarter;
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${(count / state.data.length) * 100}%`;
      progressFill.style.backgroundColor = '#0E71EB';
      
      const countLabel = document.createElement('span');
      countLabel.className = 'quarter-count';
      countLabel.textContent = count;
      
      progressBar.appendChild(progressFill);
      quarterBar.appendChild(quarterLabel);
      quarterBar.appendChild(progressBar);
      quarterBar.appendChild(countLabel);
      
      elements.quarterStats.appendChild(quarterBar);
    });
  
  // Update categories in the summary panel
  elements.categoryStats.innerHTML = '';
  
  // Get category counts
  const categoryCount = getCategoryCounts();
  
  // Get top 5 categories
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([category, count]) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      
      const categoryDot = document.createElement('span');
      categoryDot.className = 'category-dot';
      categoryDot.style.backgroundColor = getCategoryColor(category);
      
      const categoryName = document.createElement('span');
      categoryName.className = 'category-name';
      categoryName.textContent = category;
      
      const categoryCount = document.createElement('span');
      categoryCount.className = 'category-count';
      categoryCount.textContent = count;
      
      categoryItem.appendChild(categoryDot);
      categoryItem.appendChild(categoryName);
      categoryItem.appendChild(categoryCount);
      
      elements.categoryStats.appendChild(categoryItem);
    });
}

// Get category counts
function getCategoryCounts() {
  const counts = {};
  
  state.data.forEach(feature => {
    const category = feature.category || 'Uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });
  
  return counts;
}

// Convert hex color to RGB
function hexToRgb(hex) {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

// Get data for quarter treemap
function getQuarterTreemapData() {
  // Group features by quarter and year
  const quarterCount = {};
  
  state.data.forEach(feature => {
    const quarter = Math.floor(feature.month / 3) + 1;
    const year = feature.year;
    const key = `${year} Q${quarter}`;
    
    quarterCount[key] = (quarterCount[key] || 0) + 1;
  });
  
  // Assign colors for quarters
  const quarterColors = {
    'Q1': '#4A90E2', // Blue
    'Q2': '#43A047', // Green
    'Q3': '#F5A623', // Orange
    'Q4': '#EF5350'  // Red
  };
  
  // Convert to array for treemap
  return Object.entries(quarterCount).map(([quarterKey, count]) => {
    // Extract quarter from the key (e.g. '2022 Q1' -> 'Q1')
    const quarterPart = quarterKey.split(' ')[1];
    
    return {
      label: quarterKey,
      value: count,
      color: quarterColors[quarterPart] || '#78909C', // Default color if not found
      quarter: quarterPart,
      year: quarterKey.split(' ')[0]
    };
  });
}

// Get data for quarter-category treemap (when a quarter is selected)
function getQuarterCategoryTreemapData(selectedQuarter) {
  const [year, quarter] = selectedQuarter.split(' ');
  const quarterNum = parseInt(quarter.substring(1)) - 1; // Convert Q1 to 0, Q2 to 1, etc.
  
  // Calculate month range for the quarter
  const startMonth = quarterNum * 3;
  const endMonth = startMonth + 2;
  
  // Filter features for the selected quarter
  const quarterFeatures = state.data.filter(feature => {
    return feature.year.toString() === year && 
           feature.month >= startMonth && 
           feature.month <= endMonth;
  });
  
  // Count features by category
  const categoryCount = {};
  
  quarterFeatures.forEach(feature => {
    const category = feature.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  // Convert to array for treemap
  return Object.entries(categoryCount).map(([category, count]) => ({
    label: category,
    value: count,
    color: getCategoryColor(category),
    quarter: quarter,
    year: year
  }));
}

// Handle quarter click in treemap (for drill-down)
function handleQuarterClick(quarter) {
  if (state.treemapLevel === 'quarter') {
    // Update state for drill-down
    state.selectedQuarter = quarter;
    state.treemapLevel = 'quarter-category';
    state.selectedCategory = null;
    
    // Get quarter features and update selected features
    const [year, quarterPart] = quarter.split(' ');
    const quarterNum = parseInt(quarterPart.substring(1)) - 1;
    const startMonth = quarterNum * 3;
    const endMonth = startMonth + 2;
    
    state.selectedFeatures = state.data.filter(feature => {
      return feature.year.toString() === year && 
             feature.month >= startMonth && 
             feature.month <= endMonth;
    });
    
    // Hide details panel during drill-down
    elements.categoryDetails.classList.add('hidden');
    
    // Render the quarter-category treemap
    renderTreemapView();
    
    // Update legend to show categories
    generateCategoryLegend();
  }
}

// Handle category click in quarter-category view
function handleQuarterCategoryClick(category) {
  if (state.treemapLevel === 'quarter-category') {
    // Get quarter features
    const [year, quarter] = state.selectedQuarter.split(' ');
    const quarterNum = parseInt(quarter.substring(1)) - 1;
    const startMonth = quarterNum * 3;
    const endMonth = startMonth + 2;
    
    // Filter features by category and quarter
    state.selectedCategory = category;
    state.selectedFeatures = state.data.filter(feature => {
      return feature.year.toString() === year && 
             feature.month >= startMonth && 
             feature.month <= endMonth &&
             feature.category === category;
    });
    
    // Render quarter-category details
    renderQuarterCategoryDetails();
  }
}

// Render quarter details panel
function renderQuarterDetails() {
  // Update container visibility
  elements.categoryDetails.classList.remove('hidden');
  
  // Parse quarter info
  const [year, quarter] = state.selectedQuarter.split(' ');
  const quarterNum = parseInt(quarter.substring(1)) - 1;
  const startMonth = quarterNum * 3;
  const endMonth = startMonth + 2;
  
  // Quarter colors
  const quarterColors = {
    'Q1': '#4A90E2', // Blue
    'Q2': '#43A047', // Green
    'Q3': '#F5A623', // Orange
    'Q4': '#EF5350'  // Red
  };
  
  // Calculate quarter metrics
  const metrics = calculateCategoryMetrics(state.selectedFeatures);
  
  // Create quarter details
  elements.categoryDetails.innerHTML = `
    <div class="category-details-header">
      <h4 class="category-title" style="color: ${quarterColors[quarter] || '#78909C'}">
        ${state.selectedQuarter} Features
      </h4>
      <div class="category-actions">
        <span class="category-count">
          ${state.selectedFeatures.length} feature${state.selectedFeatures.length !== 1 ? 's' : ''}
        </span>
        <button id="drillDownBtn" class="drill-down-btn">
          Show Categories
        </button>
      </div>
    </div>
    
    <div class="category-metrics">
      <div class="metric-card">
        <div class="metric-card-label">Months</div>
        <div class="metric-card-value">${monthNames[startMonth]} - ${monthNames[endMonth]}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Top Category</div>
        <div class="metric-card-value">${getTopCategoryForQuarter(state.selectedQuarter)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Avg Features/Month</div>
        <div class="metric-card-value">${(state.selectedFeatures.length / 3).toFixed(1)}</div>
      </div>
    </div>
    
    <div class="category-features-list" id="quarterFeatures">
      ${state.selectedFeatures.length > 0 ? '' : '<p class="no-features">No features found for this quarter</p>'}
    </div>
  `;
  
  // Add drill-down button event listener
  document.getElementById('drillDownBtn').addEventListener('click', () => {
    // Change to quarter-category view
    state.treemapLevel = 'quarter-category';
    state.selectedCategory = null;
    
    // Hide details panel during drill-down
    elements.categoryDetails.classList.add('hidden');
    
    // Render the quarter-category treemap
    renderTreemapView();
  });
  
  // Get container for feature items
  const featuresContainer = document.getElementById('quarterFeatures');
  
  if (featuresContainer && state.selectedFeatures.length > 0) {
    // Sort features by date (newest first)
    const sortedFeatures = [...state.selectedFeatures].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    
    // Add feature items
    renderFeatureItems(sortedFeatures, featuresContainer);
  }
}

// Render quarter-category details panel
function renderQuarterCategoryDetails() {
  // Update container visibility
  elements.categoryDetails.classList.remove('hidden');
  
  // Calculate metrics
  const metrics = calculateCategoryMetrics(state.selectedFeatures);
  
  // Get category color
  const categoryColor = getCategoryColor(state.selectedCategory);
  
  // Create category details
  elements.categoryDetails.innerHTML = `
    <div class="category-details-header">
      <h4 class="category-title" style="color: ${categoryColor}">
        ${state.selectedCategory} in ${state.selectedQuarter}
      </h4>
      <span class="category-count">
        ${state.selectedFeatures.length} feature${state.selectedFeatures.length !== 1 ? 's' : ''}
      </span>
    </div>
    
    <div class="category-metrics">
      <div class="metric-card">
        <div class="metric-card-label">Avg Time to Release</div>
        <div class="metric-card-value">${metrics.avgTimeToRelease} days</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Total Bugs</div>
        <div class="metric-card-value">${metrics.totalBugs} (${metrics.bugRatio}/feature)</div>
      </div>
      <div class="metric-card">
        <div class="metric-card-label">Top Contributors</div>
        <div class="metric-card-value">
          ${metrics.topContributors.map(([team, count]) => `${team} (${count})`).join(', ')}
        </div>
      </div>
    </div>
    
    <div class="category-features-list" id="quarterCategoryFeatures">
      ${state.selectedFeatures.length > 0 ? '' : '<p class="no-features">No features found</p>'}
    </div>
  `;
  
  // Get container for feature items
  const featuresContainer = document.getElementById('quarterCategoryFeatures');
  
  if (featuresContainer && state.selectedFeatures.length > 0) {
    // Sort features by date (newest first)
    const sortedFeatures = [...state.selectedFeatures].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    
    // Add feature items
    renderFeatureItems(sortedFeatures, featuresContainer);
  }
}

// Helper function to find the top category for a quarter
function getTopCategoryForQuarter(quarterKey) {
  const [year, quarter] = quarterKey.split(' ');
  const quarterNum = parseInt(quarter.substring(1)) - 1;
  const startMonth = quarterNum * 3;
  const endMonth = startMonth + 2;
  
  // Filter features for the quarter
  const features = state.data.filter(feature => {
    return feature.year.toString() === year && 
           feature.month >= startMonth && 
           feature.month <= endMonth;
  });
  
  // Count by category
  const categoryCount = {};
  features.forEach(feature => {
    const category = feature.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  // Find category with max count
  let maxCount = 0;
  let topCategory = 'None';
  
  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = category;
    }
  });
  
  return topCategory;
}

// Helper function to render feature items
function renderFeatureItems(features, container) {
  features.forEach(feature => {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    
    const featureHeader = document.createElement('div');
    featureHeader.className = 'feature-header';
    
    // Category indicator
    const categoryTag = document.createElement('span');
    categoryTag.className = 'feature-category';
    categoryTag.textContent = feature.category;
    const categoryColor = getCategoryColor(feature.category);
    categoryTag.style.backgroundColor = `${categoryColor}20`; // 20% opacity
    categoryTag.style.color = categoryColor;
    featureHeader.appendChild(categoryTag);
    
    // Impact indicator
    const impactIndicator = document.createElement('span');
    impactIndicator.className = `impact-label impact-${feature.impact.toLowerCase()}`;
    impactIndicator.textContent = feature.impact;
    featureHeader.appendChild(impactIndicator);
    
    // Team indicator
    const teamIndicator = document.createElement('span');
    teamIndicator.className = 'team-label';
    teamIndicator.textContent = feature.team;
    featureHeader.appendChild(teamIndicator);
    
    // Date
    const dateDisplay = document.createElement('span');
    dateDisplay.className = 'feature-date';
    dateDisplay.textContent = new Date(feature.date).toLocaleDateString();
    featureHeader.appendChild(dateDisplay);
    
    featureItem.appendChild(featureHeader);
    
    // Description
    const description = document.createElement('p');
    description.className = 'feature-description';
    description.textContent = feature.description;
    
    // Feature metadata
    const metadata = document.createElement('div');
    metadata.className = 'feature-metadata';
    metadata.innerHTML = `
      <span class="metadata-item">Bug Count: ${feature.bugCount}</span>
      <span class="metadata-item">Time to Release: ${feature.timeToRelease} days</span>
      <span class="metadata-item">Complexity: ${feature.complexity}</span>
    `;
    
    featureItem.appendChild(description);
    featureItem.appendChild(metadata);
    container.appendChild(featureItem);
  });
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);