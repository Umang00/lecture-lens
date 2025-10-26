/**
 * GitHub repository scraper using Octokit API
 */

import { Octokit } from '@octokit/rest';
import type { Scraper, ScrapedContent } from './types';
import { validateGitHubUrl } from './validators';

const githubToken = process.env.GITHUB_TOKEN; // Optional, increases rate limit

const octokit = new Octokit({
  auth: githubToken,
});

/**
 * Extract owner and repo from GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)\/?$/i);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
  };
}

/**
 * Scrape GitHub repository README
 */
async function scrapeGitHub(url: string): Promise<ScrapedContent> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL format');
  }

  try {
    // Fetch repository info
    const { data: repo } = await octokit.rest.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });

    // Fetch README
    let readmeContent = '';
    try {
      const { data: readme } = await octokit.rest.repos.getReadme({
        owner: parsed.owner,
        repo: parsed.repo,
        mediaType: {
          format: 'raw', // Get raw markdown content
        },
      });

      readmeContent = readme as unknown as string;
    } catch (readmeError) {
      // README not found, use description
      console.warn(`No README found for ${parsed.owner}/${parsed.repo}, using description`);
      readmeContent = repo.description || 'No description available';
    }

    return {
      title: repo.full_name,
      content: readmeContent,
      metadata: {
        owner: repo.owner.login,
        repo: repo.name,
        stars: repo.stargazers_count,
        language: repo.language,
        topics: repo.topics || [],
        description: repo.description,
        homepage: repo.homepage,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        scrapedAt: new Date().toISOString(),
        contentLength: readmeContent.length,
      },
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`Repository not found: ${parsed.owner}/${parsed.repo}`);
    }
    if (error.status === 403 && error.message.includes('rate limit')) {
      throw new Error('GitHub API rate limit exceeded. Try adding GITHUB_TOKEN to .env.local');
    }
    throw new Error(`Failed to scrape GitHub repo: ${error.message}`);
  }
}

export const githubScraper: Scraper = {
  name: 'github',
  validate: validateGitHubUrl,
  scrape: scrapeGitHub,
};
