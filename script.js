// Global state
const state = {
  data: [],
  view: 'treemap', // 'treemap', 'year', or 'month'
  year: 2022,
  month: 0, // 0-based (January is 0)
  selectedDay: null,
  selectedMonthIndex: null,
  selectedCategory: null,
  selectedFeatures: [],
  yearRange: { min: 2022, max: 2024 }
};

// Category colors - defining distinct colors for each category
const categoryColors = {
  'UI/UX': '#1E88E5',         // Blue
  'Security': '#D32F2F',       // Red
  'Performance': '#43A047',    // Green
  'API': '#FF9800',            // Orange
  'Admin Controls': '#9C27B0', // Purple
  'Integration': '#3949AB',    // Indigo
  'Audio/Video': '#00ACC1',    // Cyan
  'Chat': '#E91E63',           // Pink
  'Whiteboard': '#8BC34A',     // Light Green
  'Mobile': '#795548',         // Brown
  'Desktop': '#607D8B',        // Blue Grey
  'Cloud Storage': '#00BCD4',  // Teal
  'Calendar': '#FFEB3B',       // Yellow
  'Meeting': '#FF9800',        // Orange
  'Background': '#9E9E9E',     // Grey
  'Analytics': '#F44336',      // Red
  'Settings': '#4527A0',       // Deep Purple
  'Recording': '#F57F17',      // Amber
  'Search': '#FFA000',         // Amber
  'Notifications': '#EF6C00',  // Orange
  'Uncategorized': '#78909C'   // Blue Grey Light
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
    initializeNormalizedCategoryColors();
    
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

// Initialize normalized category colors
function initializeNormalizedCategoryColors() {
  // Create normalized map for case-insensitive matching
  Object.keys(categoryColors).forEach(category => {
    normalizedCategoryColors[normalizeCategory(category)] = categoryColors[category];
  });
}

// Normalize category for consistent matching
function normalizeCategory(category) {
  if (!category) return '';
  return category.trim().toLowerCase();
}

// Get color for a category with normalization
function getCategoryColor(category) {
  if (!category) return '#78909C'; // Default color
  
  // Try direct match first
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  
  // Try normalized match
  const normalizedKey = normalizeCategory(category);
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
      bugCount: getBugCount(item)
    };
  });
  
  // Filter to only include data in the specified date range
  return processedData.filter(item => {
    const date = new Date(item.date);
    return date >= DATE_RANGE.start && date <= DATE_RANGE.end;
  });
}

// Extract team information (mocked for demonstration)
function getTeam(item) {
  const teams = ['Frontend', 'Backend', 'Mobile', 'Security', 'Infrastructure', 'Design', 'API'];
  return teams[Math.floor(Math.random() * teams.length)];
}

// Extract bug count (mocked for demonstration)
function getBugCount(item) {
  // In a real implementation, this would pull from actual bug data
  return Math.floor(Math.random() * 5);
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
    state.selectedDay = null;
    state.selectedMonthIndex = null;
    state.selectedFeatures = [];
    updateUI();
  });
  
  elements.yearViewBtn.addEventListener('click', () => {
    state.view = 'year';
    state.selectedMonthIndex = null;
    state.selectedCategory = null;
    state.selectedFeatures = [];
    updateUI();
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
}

// Generate category legend
function generateCategoryLegend() {
  elements.categoryLegend.innerHTML = '';
  
  // Get all unique categories from the data
  const categories = {};
  state.data.forEach(feature => {
    categories[feature.category] = true;
  });
  
  // Create legend items
  Object.keys(categories).sort().forEach(category => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const categoryColor = getCategoryColor(category);
    
    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'legend-color';
    colorSwatch.style.backgroundColor = categoryColor;
    
    const categoryName = document.createElement('span');
    categoryName.className = 'legend-label';
    categoryName.textContent = category;
    
    legendItem.appendChild(colorSwatch);
    legendItem.appendChild(categoryName);
    
    // Add click handler for filtering
    legendItem.addEventListener('click', () => {
      if (state.view === 'treemap') {
        handleCategoryClick(category);
      }
    });
    
    elements.categoryLegend.appendChild(legendItem);
  });
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
  
  // Generate velocity trend chart (simplified version for display)
  generateVelocityTrend();
}

// Generate a simplified velocity trend chart
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
}

// Update active state of buttons
function updateActiveButtons() {
  // View buttons
  elements.treemapViewBtn.classList.toggle('active', state.view === 'treemap');
  elements.yearViewBtn.classList.toggle('active', state.view === 'year');
}

// Update view visibility
function updateViewVisibility() {
  elements.treemapView.classList.toggle('hidden', state.view !== 'treemap');
  elements.yearlyView.classList.toggle('hidden', state.view !== 'year');
  elements.monthlyView.classList.toggle('hidden', state.view !== 'month');
}

// Render treemap view
function renderTreemapView() {
  // Count features by category
  const categoryCount = {};
  state.data.forEach(feature => {
    const category = feature.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  // Convert to array for treemap
  const categoryData = Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count,
    color: getCategoryColor(category)
  })).sort((a, b) => b.count - a.count);
  
  // Clear container
  elements.treemapContainer.innerHTML = '';
  
  // Create treemap
  const treemap = document.createElement('div');
  treemap.className = 'treemap-grid';
  
  // Total features
  const totalFeatures = state.data.length;
  
  // Create treemap cells with improved sizing algorithm
  categoryData.forEach(data => {
    const { category, count, color } = data;
    
    // Improved sizing algorithm - more proportional to count
    // Base size is proportional but we apply a non-linear transformation
    // to compress the range and ensure small categories are still visible
    const baseSize = count / totalFeatures;
    const minSize = 0.03; // Minimum size for visibility
    const compressedSize = Math.pow(baseSize, 0.7); // Power less than 1 compresses range
    const sizeRatio = Math.max(minSize, compressedSize);
    const flexGrow = sizeRatio * 25; // Scale for better visualization
    
    // Create cell
    const cell = document.createElement('div');
    cell.className = 'treemap-cell';
    cell.style.backgroundColor = color;
    cell.style.flexGrow = flexGrow;
    
    // Add label
    const label = document.createElement('div');
    label.className = 'treemap-label';
    label.innerHTML = `<div>${category}</div><div>${count}</div>`;
    cell.appendChild(label);
    
    // Add selected class if this category is selected
    if (category === state.selectedCategory) {
      cell.classList.add('selected');
    }
    
    // Add tooltip with extended information
    cell.setAttribute('data-tooltip', `${category}: ${count} features (${(count/totalFeatures*100).toFixed(1)}% of total)`);
    cell.title = `${category}: ${count} features`;
    
    // Add click handler
    cell.addEventListener('click', () => {
      handleCategoryClick(category);
    });
    
    treemap.appendChild(cell);
  });
  
  elements.treemapContainer.appendChild(treemap);
  
  // Update category details if a category is selected
  if (state.selectedCategory) {
    renderCategoryDetails();
  } else {
    elements.categoryDetails.classList.add('hidden');
  }
}

// Handle category click in treemap
function handleCategoryClick(category) {
  if (state.selectedCategory === category) {
    // Clear selection if clicking the same category again
    state.selectedCategory = null;
    state.selectedFeatures = [];
    elements.categoryDetails.classList.add('hidden');
  } else {
    state.selectedCategory = category;
    state.selectedFeatures = state.data.filter(
      feature => feature.category === category
    );
    renderCategoryDetails();
  }
  
  // Re-render the treemap to update selected state
  renderTreemapView();
}

// Calculate category metrics
function calculateCategoryMetrics(features) {
  // Calculate time to release (mock data for demonstration)
  const avgTimeToRelease = Math.round(Math.random() * 20 + 10); // 10-30 days
  
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
    topContributors
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
        <div class="metric-card-value">${metrics.totalBugs}</div>
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
      `;
      
      featureItem.appendChild(description);
      featureItem.appendChild(metadata);
      featuresContainer.appendChild(featureItem);
    });
  }
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
    `;
    
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

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);