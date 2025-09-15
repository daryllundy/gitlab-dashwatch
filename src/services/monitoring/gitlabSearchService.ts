// GitLab Advanced Search and Filtering Service
// Provides sophisticated search capabilities and advanced filtering options

import { logger } from '@/lib/logger';
import type { GitlabProject } from '@/types';

// Search and filter configuration
interface SearchConfig {
  enableFullTextSearch: boolean;
  enableFuzzySearch: boolean;
  maxSearchResults: number;
  searchTimeout: number; // seconds
  enableSearchHistory: boolean;
  maxSearchHistory: number;
  enableSavedSearches: boolean;
  enableSearchSuggestions: boolean;
  enableAnalytics: boolean;
  relevanceScoring: boolean;
}

interface SearchQuery {
  query: string;
  filters: SearchFilters;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  page: number;
  perPage: number;
}

interface SearchFilters {
  instances?: string[];
  visibility?: ('public' | 'private' | 'internal')[];
  archived?: boolean;
  hasIssues?: boolean;
  hasMergeRequests?: boolean;
  hasWiki?: boolean;
  hasSnippets?: boolean;
  starCount?: {
    min?: number;
    max?: number;
  };
  forkCount?: {
    min?: number;
    max?: number;
  };
  lastActivity?: {
    from?: Date;
    to?: Date;
  };
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  topics?: string[];
  languages?: string[];
  license?: string[];
  owner?: string[];
  tags?: string[];
  pipelineStatus?: ('success' | 'failed' | 'running' | 'pending' | 'canceled' | 'skipped')[];
  branch?: string;
  defaultBranch?: string;
}

interface SortOption {
  field: 'name' | 'created_at' | 'updated_at' | 'star_count' | 'fork_count' | 'last_activity_at' | 'relevance';
  order: 'asc' | 'desc';
}

interface SearchResult {
  projects: GitlabProject[];
  totalCount: number;
  searchTime: number;
  query: SearchQuery;
  facets: SearchFacets;
  suggestions?: string[];
}

interface SearchFacets {
  instances: { [key: string]: number };
  visibility: { [key: string]: number };
  languages: { [key: string]: number };
  topics: { [key: string]: number };
  owners: { [key: string]: number };
  licenses: { [key: string]: number };
  pipelineStatus: { [key: string]: number };
  activityRanges: { [key: string]: number };
}

interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  isPublic: boolean;
}

interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularFilters: Array<{ filter: string; count: number }>;
  averageSearchTime: number;
  noResultsCount: number;
  searchTrends: Array<{ date: string; count: number }>;
}

class GitlabSearchService {
  private config: SearchConfig;
  private searchHistory: SearchQuery[] = [];
  private savedSearches: Map<string, SavedSearch> = new Map();
  private searchAnalytics: SearchAnalytics;
  private searchIndex: Map<string, GitlabProject> = new Map();
  private isDestroyed = false;

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = {
      enableFullTextSearch: true,
      enableFuzzySearch: true,
      maxSearchResults: 1000,
      searchTimeout: 30,
      enableSearchHistory: true,
      maxSearchHistory: 100,
      enableSavedSearches: true,
      enableSearchSuggestions: true,
      enableAnalytics: true,
      relevanceScoring: true,
      ...config,
    };

    this.searchAnalytics = {
      totalSearches: 0,
      popularQueries: [],
      popularFilters: [],
      averageSearchTime: 0,
      noResultsCount: 0,
      searchTrends: [],
    };

    this.initializeSearchIndex();
  }

  /**
   * Perform advanced search with filtering
   */
  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      logger.info('Performing advanced search', 'GitlabSearchService', {
        query: searchQuery.query,
        filtersCount: Object.keys(searchQuery.filters).length,
      });

      // Apply search timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), this.config.searchTimeout * 1000);
      });

      const searchPromise = this.performSearch(searchQuery);

      const result = await Promise.race([searchPromise, timeoutPromise]);
      const searchTime = Date.now() - startTime;

      // Update analytics
      if (this.config.enableAnalytics) {
        this.updateSearchAnalytics(searchQuery, result, searchTime);
      }

      // Add to search history
      if (this.config.enableSearchHistory) {
        this.addToSearchHistory(searchQuery);
      }

      logger.info(`Search completed in ${searchTime}ms`, 'GitlabSearchService', {
        resultsCount: result.projects.length,
        totalCount: result.totalCount,
      });

      return result;

    } catch (error) {
      const searchTime = Date.now() - startTime;

      logger.error('Search failed', 'GitlabSearchService', error, {
        query: searchQuery.query,
        searchTime,
      });

      throw error;
    }
  }

  /**
   * Perform the actual search operation
   */
  private async performSearch(searchQuery: SearchQuery): Promise<SearchResult> {
    let allProjects = Array.from(this.searchIndex.values());

    // Apply text search
    if (searchQuery.query.trim()) {
      allProjects = this.applyTextSearch(allProjects, searchQuery.query);
    }

    // Apply filters
    allProjects = this.applyFilters(allProjects, searchQuery.filters);

    // Calculate facets before pagination
    const facets = this.calculateFacets(allProjects);

    // Apply sorting
    allProjects = this.applySorting(allProjects, searchQuery.sortBy);

    // Apply pagination
    const totalCount = allProjects.length;
    const startIndex = (searchQuery.page - 1) * searchQuery.perPage;
    const endIndex = startIndex + searchQuery.perPage;
    const paginatedProjects = allProjects.slice(startIndex, endIndex);

    // Generate suggestions if enabled
    const suggestions = this.config.enableSearchSuggestions
      ? this.generateSuggestions(searchQuery.query, allProjects)
      : undefined;

    return {
      projects: paginatedProjects,
      totalCount,
      searchTime: 0, // Will be set by caller
      query: searchQuery,
      facets,
      suggestions,
    };
  }

  /**
   * Apply text search with full-text and fuzzy matching
   */
  private applyTextSearch(projects: GitlabProject[], query: string): GitlabProject[] {
    if (!query.trim()) return projects;

    const searchTerms = query.toLowerCase().split(/\s+/);
    const scoredProjects: Array<{ project: GitlabProject; score: number }> = [];

    for (const project of projects) {
      let totalScore = 0;
      const searchableText = this.getSearchableText(project).toLowerCase();

      for (const term of searchTerms) {
        let termScore = 0;

        // Exact match in name (highest priority)
        if (project.name.toLowerCase().includes(term)) {
          termScore += 10;
          if (project.name.toLowerCase().startsWith(term)) {
            termScore += 5; // Boost for prefix matches
          }
        }

        // Match in description
        if (project.description?.toLowerCase().includes(term)) {
          termScore += 3;
        }

        // Fuzzy matching if enabled
        if (this.config.enableFuzzySearch && termScore === 0) {
          const fuzzyScore = this.calculateFuzzyScore(searchableText, term);
          if (fuzzyScore > 0.6) { // 60% similarity threshold
            termScore += fuzzyScore * 2;
          }
        }

        totalScore += termScore;
      }

      if (totalScore > 0) {
        scoredProjects.push({ project, score: totalScore });
      }
    }

    // Sort by relevance score and return projects
    return scoredProjects
      .sort((a, b) => b.score - a.score)
      .map(item => item.project);
  }

  /**
   * Apply advanced filters
   */
  private applyFilters(projects: GitlabProject[], filters: SearchFilters): GitlabProject[] {
    return projects.filter(project => {
      // Instance filter
      if (filters.instances && filters.instances.length > 0) {
        if (!filters.instances.includes(project.instanceId)) {
          return false;
        }
      }

      // Visibility filter
      if (filters.visibility && filters.visibility.length > 0) {
        if (!filters.visibility.includes(project.visibility)) {
          return false;
        }
      }

      // Archived filter
      if (filters.archived !== undefined) {
        // Note: GitLab API doesn't provide archived status in basic project data
        // This would need to be fetched separately or stored in extended project data
      }

      // Issues filter
      if (filters.hasIssues !== undefined) {
        const hasIssues = project.openIssues > 0;
        if (filters.hasIssues !== hasIssues) {
          return false;
        }
      }

      // Merge requests filter
      if (filters.hasMergeRequests !== undefined) {
        const hasMRs = project.pullRequests > 0;
        if (filters.hasMergeRequests !== hasMRs) {
          return false;
        }
      }

      // Star count filter
      if (filters.starCount) {
        const starCount = project.starCount || 0;
        if (filters.starCount.min !== undefined && starCount < filters.starCount.min) {
          return false;
        }
        if (filters.starCount.max !== undefined && starCount > filters.starCount.max) {
          return false;
        }
      }

      // Fork count filter
      if (filters.forkCount) {
        const forkCount = project.forkCount || 0;
        if (filters.forkCount.min !== undefined && forkCount < filters.forkCount.min) {
          return false;
        }
        if (filters.forkCount.max !== undefined && forkCount > filters.forkCount.max) {
          return false;
        }
      }

      // Last activity filter
      if (filters.lastActivity) {
        const lastActivity = new Date(project.lastActivityAt);
        if (filters.lastActivity.from && lastActivity < filters.lastActivity.from) {
          return false;
        }
        if (filters.lastActivity.to && lastActivity > filters.lastActivity.to) {
          return false;
        }
      }

      // Created date filter
      if (filters.createdAt) {
        const createdAt = new Date(project.createdAt);
        if (filters.createdAt.from && createdAt < filters.createdAt.from) {
          return false;
        }
        if (filters.createdAt.to && createdAt > filters.createdAt.to) {
          return false;
        }
      }

      // Topics filter
      if (filters.topics && filters.topics.length > 0) {
        // Note: Topics/tags would need to be fetched from extended project data
        // This is a placeholder for topic filtering logic
      }

      // Languages filter
      if (filters.languages && filters.languages.length > 0) {
        // Note: Languages would need to be fetched from project languages endpoint
        // This is a placeholder for language filtering logic
      }

      // Pipeline status filter
      if (filters.pipelineStatus && filters.pipelineStatus.length > 0) {
        if (!project.pipelineStatus || !filters.pipelineStatus.includes(project.pipelineStatus)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to search results
   */
  private applySorting(projects: GitlabProject[], sortBy: SortOption): GitlabProject[] {
    return projects.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'star_count':
          aValue = a.starCount || 0;
          bValue = b.starCount || 0;
          break;
        case 'fork_count':
          aValue = a.forkCount || 0;
          bValue = b.forkCount || 0;
          break;
        case 'last_activity_at':
          aValue = new Date(a.lastActivityAt).getTime();
          bValue = new Date(b.lastActivityAt).getTime();
          break;
        case 'relevance':
          // Relevance is already handled in text search
          return 0;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortBy.order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortBy.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Calculate search facets
   */
  private calculateFacets(projects: GitlabProject[]): SearchFacets {
    const facets: SearchFacets = {
      instances: {},
      visibility: {},
      languages: {},
      topics: {},
      owners: {},
      licenses: {},
      pipelineStatus: {},
      activityRanges: {},
    };

    for (const project of projects) {
      // Instance facet
      facets.instances[project.instanceId] = (facets.instances[project.instanceId] || 0) + 1;

      // Visibility facet
      facets.visibility[project.visibility] = (facets.visibility[project.visibility] || 0) + 1;

      // Pipeline status facet
      if (project.pipelineStatus) {
        facets.pipelineStatus[project.pipelineStatus] = (facets.pipelineStatus[project.pipelineStatus] || 0) + 1;
      }

      // Activity ranges (simplified)
      const lastActivity = new Date(project.lastActivityAt);
      const now = new Date();
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let activityRange: string;
      if (daysSinceActivity <= 1) activityRange = 'Today';
      else if (daysSinceActivity <= 7) activityRange = 'This week';
      else if (daysSinceActivity <= 30) activityRange = 'This month';
      else if (daysSinceActivity <= 90) activityRange = 'Last 3 months';
      else activityRange = 'Older';

      facets.activityRanges[activityRange] = (facets.activityRanges[activityRange] || 0) + 1;
    }

    return facets;
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, allProjects: GitlabProject[]): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Extract popular terms from project names and descriptions
    const terms = new Map<string, number>();

    for (const project of allProjects.slice(0, 100)) { // Limit to first 100 for performance
      const nameWords = project.name.toLowerCase().split(/[\s\-_]+/);
      const descWords = project.description?.toLowerCase().split(/[\s\-_]+/) || [];

      [...nameWords, ...descWords].forEach(word => {
        if (word.length > 2 && word.includes(queryLower)) {
          terms.set(word, (terms.get(word) || 0) + 1);
        }
      });
    }

    // Sort by frequency and return top suggestions
    const sortedTerms = Array.from(terms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    return sortedTerms;
  }

  /**
   * Calculate fuzzy matching score
   */
  private calculateFuzzyScore(text: string, pattern: string): number {
    if (!pattern) return 0;
    if (!text) return 0;

    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // Simple Levenshtein distance calculation
    const matrix = [];
    for (let i = 0; i <= textLower.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= patternLower.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= textLower.length; i++) {
      for (let j = 1; j <= patternLower.length; j++) {
        if (textLower.charAt(i - 1) === patternLower.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[textLower.length][patternLower.length];
    const maxLength = Math.max(textLower.length, patternLower.length);

    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Get searchable text from project
   */
  private getSearchableText(project: GitlabProject): string {
    return [
      project.name,
      project.description,
      project.defaultBranch,
      project.webUrl,
      project.sshUrl,
      project.httpUrl,
      // Add other searchable fields as needed
    ].filter(Boolean).join(' ');
  }

  /**
   * Initialize search index
   */
  private initializeSearchIndex(): void {
    // This would load projects from cache or API
    // For now, we'll start with an empty index
    logger.info('Search index initialized', 'GitlabSearchService');
  }

  /**
   * Update search index with new projects
   */
  updateSearchIndex(projects: GitlabProject[]): void {
    for (const project of projects) {
      this.searchIndex.set(project.id.toString(), project);
    }

    logger.debug(`Updated search index with ${projects.length} projects`, 'GitlabSearchService');
  }

  /**
   * Remove projects from search index
   */
  removeFromSearchIndex(projectIds: number[]): void {
    for (const projectId of projectIds) {
      this.searchIndex.delete(projectId.toString());
    }

    logger.debug(`Removed ${projectIds.length} projects from search index`, 'GitlabSearchService');
  }

  /**
   * Add query to search history
   */
  private addToSearchHistory(query: SearchQuery): void {
    this.searchHistory.unshift(query);

    // Keep only the most recent searches
    if (this.searchHistory.length > this.config.maxSearchHistory) {
      this.searchHistory = this.searchHistory.slice(0, this.config.maxSearchHistory);
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchQuery[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    logger.info('Search history cleared', 'GitlabSearchService');
  }

  /**
   * Save a search query
   */
  saveSearch(name: string, query: SearchQuery, isPublic = false): string {
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const savedSearch: SavedSearch = {
      id: searchId,
      name,
      query: { ...query },
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      isPublic,
    };

    this.savedSearches.set(searchId, savedSearch);

    logger.info(`Saved search: ${name}`, 'GitlabSearchService', { searchId });

    return searchId;
  }

  /**
   * Get saved searches
   */
  getSavedSearches(): SavedSearch[] {
    return Array.from(this.savedSearches.values());
  }

  /**
   * Execute saved search
   */
  async executeSavedSearch(searchId: string): Promise<SearchResult> {
    const savedSearch = this.savedSearches.get(searchId);
    if (!savedSearch) {
      throw new Error(`Saved search not found: ${searchId}`);
    }

    // Update usage statistics
    savedSearch.lastUsed = new Date();
    savedSearch.useCount++;

    return this.search(savedSearch.query);
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(searchId: string): void {
    const deleted = this.savedSearches.delete(searchId);
    if (deleted) {
      logger.info(`Deleted saved search: ${searchId}`, 'GitlabSearchService');
    }
  }

  /**
   * Update search analytics
   */
  private updateSearchAnalytics(query: SearchQuery, result: SearchResult, searchTime: number): void {
    this.searchAnalytics.totalSearches++;

    // Update popular queries
    const queryKey = query.query.toLowerCase().trim();
    if (queryKey) {
      const existingQuery = this.searchAnalytics.popularQueries.find(q => q.query === queryKey);
      if (existingQuery) {
        existingQuery.count++;
      } else {
        this.searchAnalytics.popularQueries.push({ query: queryKey, count: 1 });
      }

      // Keep only top 20
      this.searchAnalytics.popularQueries = this.searchAnalytics.popularQueries
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    // Update average search time
    const totalTime = this.searchAnalytics.averageSearchTime * (this.searchAnalytics.totalSearches - 1) + searchTime;
    this.searchAnalytics.averageSearchTime = totalTime / this.searchAnalytics.totalSearches;

    // Track no results
    if (result.totalCount === 0) {
      this.searchAnalytics.noResultsCount++;
    }

    // Update search trends (daily)
    const today = new Date().toISOString().split('T')[0];
    const todayTrend = this.searchAnalytics.searchTrends.find(t => t.date === today);
    if (todayTrend) {
      todayTrend.count++;
    } else {
      this.searchAnalytics.searchTrends.push({ date: today, count: 1 });
    }

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.searchAnalytics.searchTrends = this.searchAnalytics.searchTrends
      .filter(t => new Date(t.date) >= thirtyDaysAgo);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): SearchAnalytics {
    return { ...this.searchAnalytics };
  }

  /**
   * Get search suggestions for a partial query
   */
  getSearchSuggestions(partialQuery: string, maxSuggestions = 10): string[] {
    if (!partialQuery.trim() || !this.config.enableSearchSuggestions) {
      return [];
    }

    const queryLower = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Get suggestions from search history
    for (const historyItem of this.searchHistory) {
      if (historyItem.query.toLowerCase().startsWith(queryLower)) {
        suggestions.add(historyItem.query);
      }
    }

    // Get suggestions from popular queries
    for (const popular of this.searchAnalytics.popularQueries) {
      if (popular.query.startsWith(queryLower)) {
        suggestions.add(popular.query);
      }
    }

    // Get suggestions from project names
    for (const project of this.searchIndex.values()) {
      if (project.name.toLowerCase().startsWith(queryLower)) {
        suggestions.add(project.name);
      }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  /**
   * Create filter presets
   */
  getFilterPresets(): Array<{ name: string; filters: SearchFilters; description: string }> {
    return [
      {
        name: 'Active Projects',
        filters: {
          lastActivity: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        description: 'Projects with recent activity',
      },
      {
        name: 'Popular Projects',
        filters: {
          starCount: { min: 10 },
        },
        description: 'Projects with 10+ stars',
      },
      {
        name: 'Private Projects',
        filters: {
          visibility: ['private'],
        },
        description: 'Private projects only',
      },
      {
        name: 'Projects with Issues',
        filters: {
          hasIssues: true,
        },
        description: 'Projects that have open issues',
      },
      {
        name: 'Recently Created',
        filters: {
          createdAt: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        description: 'Projects created in the last week',
      },
    ];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Search service configuration updated', 'GitlabSearchService', newConfig);
  }

  /**
   * Export search data for backup
   */
  exportSearchData(): {
    searchHistory: SearchQuery[];
    savedSearches: SavedSearch[];
    analytics: SearchAnalytics;
  } {
    return {
      searchHistory: [...this.searchHistory],
      savedSearches: Array.from(this.savedSearches.values()),
      analytics: { ...this.searchAnalytics },
    };
  }

  /**
   * Import search data from backup
   */
  importSearchData(data: {
    searchHistory: SearchQuery[];
    savedSearches: SavedSearch[];
    analytics: SearchAnalytics;
  }): void {
    this.searchHistory = [...data.searchHistory];
    this.savedSearches.clear();
    data.savedSearches.forEach(search => {
      this.savedSearches.set(search.id, search);
    });
    this.searchAnalytics = { ...data.analytics };

    logger.info('Search data imported', 'GitlabSearchService', {
      historyCount: data.searchHistory.length,
      savedSearchesCount: data.savedSearches.length,
    });
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.searchHistory = [];
    this.savedSearches.clear();
    this.searchIndex.clear();

    logger.info('GitLab search service destroyed', 'GitlabSearchService');
  }
}

// Singleton instance
export const gitlabSearchService = new GitlabSearchService();
