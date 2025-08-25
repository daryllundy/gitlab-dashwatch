import { ROUTES } from '@/constants';

/**
 * Navigation utility functions
 */

/**
 * Navigate to settings page
 */
export const navigateToSettings = (navigate: (path: string) => void) => {
  navigate(ROUTES.SETTINGS);
};

/**
 * Navigate to home page
 */
export const navigateToHome = (navigate: (path: string) => void) => {
  navigate(ROUTES.HOME);
};

/**
 * Navigate to GitLab projects page
 */
export const navigateToGitlabProjects = (navigate: (path: string) => void) => {
  navigate(ROUTES.GITLAB_PROJECTS);
};

/**
 * Open external URL in new tab
 */
export const openExternalUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open GitLab project in new tab
 */
export const openGitlabProject = (projectName: string, instanceUrl: string) => {
  const formattedName = projectName.toLowerCase().replace(/\s+/g, '-');
  const projectUrl = `${instanceUrl}/${formattedName}`;
  openExternalUrl(projectUrl);
};

/**
 * Open Netdata interface in new tab
 */
export const openNetdataInterface = (netdataUrl: string) => {
  if (netdataUrl) {
    openExternalUrl(netdataUrl);
  }
};

/**
 * Generate project URL for GitLab
 */
export const generateGitlabProjectUrl = (projectName: string, instanceUrl: string): string => {
  const formattedName = projectName.toLowerCase().replace(/\s+/g, '-');
  return `${instanceUrl}/${formattedName}`;
};
