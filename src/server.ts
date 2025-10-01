import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import puppeteer from "puppeteer";
import * as axeCore from "axe-core";
import * as createCsvWriter from "csv-writer";
import * as cheerio from "cheerio";
import * as Color from "color";
import * as fs from "fs";
import * as path from "path";

// Create server instance
const server = new McpServer({
  name: "508-accessibility-compliance",
  version: "1.0.0",
});

// Interface for compliance results
interface ComplianceResult {
  requirement: string;
  description: string;
  status: "Comply" | "Do Not Comply" | "Partially Comply" | "Does Not Apply";
  issues: string[];
  wcagCriteria: string;
  section508Reference: string;
}

// Interface for authentication options
interface AuthenticationOptions {
  type: "none" | "basic" | "sso" | "form";
  username?: string;
  password?: string;
  ssoProvider?: "microsoft" | "google" | "okta" | "saml" | "other";
  ssoUrl?: string;
  loginFormSelector?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  waitForSelector?: string;
  cookies?: Array<{name: string, value: string, domain?: string}>;
}

// Interface for crawling options
interface CrawlingOptions {
  enabled: boolean;
  maxPages?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  sameOriginOnly?: boolean;
  followExternalLinks?: boolean;
  delayBetweenPages?: number;
}

// Interface for page analysis result
interface PageAnalysisResult {
  url: string;
  title: string;
  complianceResults: ComplianceResult[];
  crawledAt: string;
  errors?: string[];
}

// Section 508 / WCAG 2.0 Level AA Requirements
const section508Requirements = [
  {
    id: "1.1.1",
    requirement: "Non-text Content",
    description: "All non-text content has text alternatives",
    wcagCriteria: "WCAG 2.0 1.1.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.2.1",
    requirement: "Audio-only and Video-only (Prerecorded)",
    description: "Alternatives for time-based media",
    wcagCriteria: "WCAG 2.0 1.2.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.2.2",
    requirement: "Captions (Prerecorded)",
    description: "Captions for all prerecorded audio content in synchronized media",
    wcagCriteria: "WCAG 2.0 1.2.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.2.3",
    requirement: "Audio Description or Media Alternative",
    description: "Audio description or full text alternative for prerecorded video",
    wcagCriteria: "WCAG 2.0 1.2.3 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.2.4",
    requirement: "Captions (Live)",
    description: "Captions for all live audio content in synchronized media",
    wcagCriteria: "WCAG 2.0 1.2.4 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.2.5",
    requirement: "Audio Description (Prerecorded)",
    description: "Audio description for all prerecorded video content",
    wcagCriteria: "WCAG 2.0 1.2.5 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.3.1",
    requirement: "Info and Relationships",
    description: "Information and relationships can be programmatically determined",
    wcagCriteria: "WCAG 2.0 1.3.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.3.2",
    requirement: "Meaningful Sequence",
    description: "Content can be presented in a meaningful sequence",
    wcagCriteria: "WCAG 2.0 1.3.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.3.3",
    requirement: "Sensory Characteristics",
    description: "Instructions don't rely solely on sensory characteristics",
    wcagCriteria: "WCAG 2.0 1.3.3 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.4.1",
    requirement: "Use of Color",
    description: "Color is not the only means of conveying information",
    wcagCriteria: "WCAG 2.0 1.4.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.4.2",
    requirement: "Audio Control",
    description: "Control over audio that plays automatically",
    wcagCriteria: "WCAG 2.0 1.4.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.4.3",
    requirement: "Contrast (Minimum)",
    description: "4.5:1 contrast ratio for normal text, 3:1 for large text",
    wcagCriteria: "WCAG 2.0 1.4.3 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.4.4",
    requirement: "Resize Text",
    description: "Text can be resized up to 200% without loss of functionality",
    wcagCriteria: "WCAG 2.0 1.4.4 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "1.4.5",
    requirement: "Images of Text",
    description: "Use text rather than images of text",
    wcagCriteria: "WCAG 2.0 1.4.5 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.1.1",
    requirement: "Keyboard",
    description: "All functionality available via keyboard",
    wcagCriteria: "WCAG 2.0 2.1.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.1.2",
    requirement: "No Keyboard Trap",
    description: "No keyboard focus traps",
    wcagCriteria: "WCAG 2.0 2.1.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.2.1",
    requirement: "Timing Adjustable",
    description: "Time limits can be adjusted or extended",
    wcagCriteria: "WCAG 2.0 2.2.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.2.2",
    requirement: "Pause, Stop, Hide",
    description: "Control over moving, blinking, or auto-updating content",
    wcagCriteria: "WCAG 2.0 2.2.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.3.1",
    requirement: "Three Flashes or Below Threshold",
    description: "No content flashes more than 3 times per second",
    wcagCriteria: "WCAG 2.0 2.3.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.1",
    requirement: "Bypass Blocks",
    description: "Skip navigation mechanism available",
    wcagCriteria: "WCAG 2.0 2.4.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.2",
    requirement: "Page Titled",
    description: "Pages have descriptive titles",
    wcagCriteria: "WCAG 2.0 2.4.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.3",
    requirement: "Focus Order",
    description: "Focus order is logical and meaningful",
    wcagCriteria: "WCAG 2.0 2.4.3 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.4",
    requirement: "Link Purpose (In Context)",
    description: "Purpose of links can be determined from context",
    wcagCriteria: "WCAG 2.0 2.4.4 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.5",
    requirement: "Multiple Ways",
    description: "Multiple ways to locate content within a site",
    wcagCriteria: "WCAG 2.0 2.4.5 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.6",
    requirement: "Headings and Labels",
    description: "Headings and labels describe topic or purpose",
    wcagCriteria: "WCAG 2.0 2.4.6 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "2.4.7",
    requirement: "Focus Visible",
    description: "Keyboard focus indicator is visible",
    wcagCriteria: "WCAG 2.0 2.4.7 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.1.1",
    requirement: "Language of Page",
    description: "Primary language of page is programmatically determined",
    wcagCriteria: "WCAG 2.0 3.1.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.1.2",
    requirement: "Language of Parts",
    description: "Language of passages or phrases is programmatically determined",
    wcagCriteria: "WCAG 2.0 3.1.2 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.2.1",
    requirement: "On Focus",
    description: "No unexpected context changes when component receives focus",
    wcagCriteria: "WCAG 2.0 3.2.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.2.2",
    requirement: "On Input",
    description: "No unexpected context changes when changing input values",
    wcagCriteria: "WCAG 2.0 3.2.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.2.3",
    requirement: "Consistent Navigation",
    description: "Navigation mechanisms are consistent",
    wcagCriteria: "WCAG 2.0 3.2.3 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.2.4",
    requirement: "Consistent Identification",
    description: "Components with same functionality are consistently identified",
    wcagCriteria: "WCAG 2.0 3.2.4 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.3.1",
    requirement: "Error Identification",
    description: "Input errors are clearly identified",
    wcagCriteria: "WCAG 2.0 3.3.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.3.2",
    requirement: "Labels or Instructions",
    description: "Labels or instructions are provided for user input",
    wcagCriteria: "WCAG 2.0 3.3.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.3.3",
    requirement: "Error Suggestion",
    description: "Error correction suggestions are provided",
    wcagCriteria: "WCAG 2.0 3.3.3 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "3.3.4",
    requirement: "Error Prevention (Legal, Financial, Data)",
    description: "Error prevention for important submissions",
    wcagCriteria: "WCAG 2.0 3.3.4 Level AA",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "4.1.1",
    requirement: "Parsing",
    description: "Markup is properly nested and has valid attributes",
    wcagCriteria: "WCAG 2.0 4.1.1 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  },
  {
    id: "4.1.2",
    requirement: "Name, Role, Value",
    description: "Name, role, and value of UI components can be programmatically determined",
    wcagCriteria: "WCAG 2.0 4.1.2 Level A",
    section508Reference: "E205.4 (WCAG 2.0 Level A and AA)"
  }
];

// Function to crawl and discover pages
async function crawlWebsite(page: any, startUrl: string, crawlOptions: CrawlingOptions): Promise<string[]> {
  const discoveredUrls = new Set<string>([startUrl]);
  const visitedUrls = new Set<string>();
  const urlsToVisit = [{ url: startUrl, depth: 0 }];
  const maxPages = crawlOptions.maxPages || 10;
  const maxDepth = crawlOptions.maxDepth || 2;
  const sameOriginOnly = crawlOptions.sameOriginOnly !== false; // default true
  const baseUrl = new URL(startUrl);
  
  console.log(`Starting crawl from: ${startUrl}`);
  console.log(`Max pages: ${maxPages}, Max depth: ${maxDepth}, Same origin only: ${sameOriginOnly}`);

  while (urlsToVisit.length > 0 && discoveredUrls.size < maxPages) {
    const { url: currentUrl, depth } = urlsToVisit.shift()!;
    
    if (visitedUrls.has(currentUrl) || depth > maxDepth) {
      continue;
    }

    try {
      console.log(`Crawling: ${currentUrl} (depth: ${depth})`);
      visitedUrls.add(currentUrl);

      // Navigate to the page
      await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Add delay between pages if specified
      if (crawlOptions.delayBetweenPages) {
        await new Promise(resolve => setTimeout(resolve, crawlOptions.delayBetweenPages));
      }

      // Extract links from the current page
      const links = await page.evaluate(() => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        return linkElements.map(link => {
          const href = (link as HTMLAnchorElement).href;
          return {
            href: href,
            text: (link as HTMLAnchorElement).textContent?.trim() || '',
            title: (link as HTMLAnchorElement).title || ''
          };
        });
      });

      // Process discovered links
      for (const link of links) {
        try {
          const linkUrl = new URL(link.href);
          
          // Skip if same origin only is enabled and this is external
          if (sameOriginOnly && linkUrl.origin !== baseUrl.origin) {
            continue;
          }
          
          // Skip if external links are not allowed
          if (!crawlOptions.followExternalLinks && linkUrl.origin !== baseUrl.origin) {
            continue;
          }

          // Check include/exclude paths
          if (crawlOptions.includePaths && crawlOptions.includePaths.length > 0) {
            const matches = crawlOptions.includePaths.some(path => linkUrl.pathname.includes(path));
            if (!matches) continue;
          }

          if (crawlOptions.excludePaths && crawlOptions.excludePaths.length > 0) {
            const matches = crawlOptions.excludePaths.some(path => linkUrl.pathname.includes(path));
            if (matches) continue;
          }

          // Skip common non-content links
          const skipPatterns = [
            /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg)$/i,
            /^mailto:|^tel:|^javascript:|^#/,
            /logout|signout|sign-out/i,
            /\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf)$/i
          ];

          if (skipPatterns.some(pattern => pattern.test(link.href))) {
            continue;
          }

          const cleanUrl = linkUrl.origin + linkUrl.pathname; // Remove query params and fragments
          
          if (!discoveredUrls.has(cleanUrl) && !visitedUrls.has(cleanUrl)) {
            discoveredUrls.add(cleanUrl);
            if (depth < maxDepth) {
              urlsToVisit.push({ url: cleanUrl, depth: depth + 1 });
            }
          }
        } catch (error) {
          // Skip invalid URLs
          continue;
        }
      }

    } catch (error) {
      console.warn(`Failed to crawl ${currentUrl}: ${error.message}`);
      continue;
    }
  }

  const finalUrls = Array.from(discoveredUrls).slice(0, maxPages);
  console.log(`Crawling completed. Found ${finalUrls.length} pages to analyze.`);
  return finalUrls;
}

// Function to check color contrast
function getContrastRatio(color1: string, color2: string): number {
  try {
    const c1 = new (Color as any)(color1);
    const c2 = new (Color as any)(color2);
    return c1.contrast(c2);
  } catch (error) {
    return 0;
  }
}

// Function to handle authentication
async function authenticateIfNeeded(page: any, auth: AuthenticationOptions): Promise<void> {
  if (auth.type === "none") {
    return;
  }

  try {
    switch (auth.type) {
      case "basic":
        if (auth.username && auth.password) {
          // Handle HTTP Basic Authentication
          await page.authenticate({
            username: auth.username,
            password: auth.password
          });
        }
        break;

      case "form":
        if (auth.username && auth.password && auth.usernameSelector && auth.passwordSelector) {
          // Wait for login form to load
          if (auth.loginFormSelector) {
            await page.waitForSelector(auth.loginFormSelector, { timeout: 10000 });
          }
          
          // Fill in username
          await page.waitForSelector(auth.usernameSelector, { timeout: 5000 });
          await page.type(auth.usernameSelector, auth.username);
          
          // Fill in password
          await page.waitForSelector(auth.passwordSelector, { timeout: 5000 });
          await page.type(auth.passwordSelector, auth.password);
          
          // Submit form
          if (auth.submitSelector) {
            await page.click(auth.submitSelector);
          } else {
            // Try common submit selectors
            const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', '.login-button', '#login-button'];
            for (const selector of submitSelectors) {
              try {
                await page.click(selector);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          
          // Wait for successful login
          if (auth.waitForSelector) {
            await page.waitForSelector(auth.waitForSelector, { timeout: 15000 });
          } else {
            // Wait for navigation or common post-login elements
            await Promise.race([
              page.waitForNavigation({ timeout: 15000 }),
              page.waitForSelector('.dashboard', { timeout: 15000 }),
              page.waitForSelector('.user-menu', { timeout: 15000 }),
              page.waitForSelector('[data-testid="user-menu"]', { timeout: 15000 })
            ]);
          }
        }
        break;

      case "sso":
        if (auth.ssoUrl) {
          // Navigate to SSO login URL first
          await page.goto(auth.ssoUrl, { waitUntil: 'networkidle2' });
          
          // Handle different SSO providers
          switch (auth.ssoProvider) {
            case "microsoft":
              if (auth.username && auth.password) {
                await page.waitForSelector('input[type="email"]', { timeout: 10000 });
                await page.type('input[type="email"]', auth.username);
                await page.click('input[type="submit"]');
                
                await page.waitForSelector('input[type="password"]', { timeout: 10000 });
                await page.type('input[type="password"]', auth.password);
                await page.click('input[type="submit"]');
                
                // Handle "Stay signed in?" prompt
                try {
                  await page.waitForSelector('input[type="submit"][value="Yes"]', { timeout: 5000 });
                  await page.click('input[type="submit"][value="Yes"]');
                } catch (e) {
                  // Ignore if prompt doesn't appear
                }
              }
              break;

            case "google":
              if (auth.username && auth.password) {
                await page.waitForSelector('input[type="email"]', { timeout: 10000 });
                await page.type('input[type="email"]', auth.username);
                await page.click('#identifierNext');
                
                await page.waitForSelector('input[type="password"]', { timeout: 10000 });
                await page.type('input[type="password"]', auth.password);
                await page.click('#passwordNext');
              }
              break;

            case "okta":
              if (auth.username && auth.password) {
                await page.waitForSelector('#okta-signin-username', { timeout: 10000 });
                await page.type('#okta-signin-username', auth.username);
                await page.type('#okta-signin-password', auth.password);
                await page.click('#okta-signin-submit');
              }
              break;

            default:
              // Generic SSO handling
              if (auth.username && auth.password && auth.usernameSelector && auth.passwordSelector) {
                await page.waitForSelector(auth.usernameSelector, { timeout: 10000 });
                await page.type(auth.usernameSelector, auth.username);
                await page.type(auth.passwordSelector, auth.password);
                if (auth.submitSelector) {
                  await page.click(auth.submitSelector);
                }
              }
              break;
          }
          
          // Wait for successful SSO login
          if (auth.waitForSelector) {
            await page.waitForSelector(auth.waitForSelector, { timeout: 30000 });
          } else {
            await page.waitForNavigation({ timeout: 30000 });
          }
        }
        break;
    }

    // Set cookies if provided
    if (auth.cookies && auth.cookies.length > 0) {
      await page.setCookie(...auth.cookies);
    }

  } catch (error) {
    console.warn(`Authentication failed: ${error.message}`);
    // Continue with analysis even if authentication fails
  }
}

// Function to analyze multiple webpages for accessibility
async function analyzeMultipleWebpages(
  startUrl: string, 
  auth: AuthenticationOptions = { type: "none" },
  crawlOptions: CrawlingOptions = { enabled: false }
): Promise<PageAnalysisResult[]> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the start page first
    await page.goto(startUrl, { waitUntil: 'networkidle2' });
    
    // Handle authentication if required
    await authenticateIfNeeded(page, auth);
    
    // Get list of URLs to analyze
    let urlsToAnalyze: string[];
    
    if (crawlOptions.enabled) {
      // Crawl the website to discover pages
      urlsToAnalyze = await crawlWebsite(page, startUrl, crawlOptions);
    } else {
      // Just analyze the single URL
      urlsToAnalyze = [startUrl];
    }

    const results: PageAnalysisResult[] = [];

    // Analyze each discovered page
    for (let i = 0; i < urlsToAnalyze.length; i++) {
      const url = urlsToAnalyze[i];
      console.log(`Analyzing page ${i + 1}/${urlsToAnalyze.length}: ${url}`);
      
      try {
        // Navigate to the page (authentication should still be valid)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const pageTitle = await page.title();
        const complianceResults = await analyzeSinglePage(page, url);
        
        results.push({
          url: url,
          title: pageTitle,
          complianceResults: complianceResults,
          crawledAt: new Date().toISOString()
        });

        // Add small delay between page analyses
        if (i < urlsToAnalyze.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.warn(`Failed to analyze ${url}: ${error.message}`);
        results.push({
          url: url,
          title: 'Error loading page',
          complianceResults: [],
          crawledAt: new Date().toISOString(),
          errors: [error.message]
        });
      }
    }

    return results;

  } finally {
    await browser.close();
  }
}

// Function to analyze a single page (extracted from original analyzeWebpage)
async function analyzeSinglePage(page: any, url: string): Promise<ComplianceResult[]> {
    // Inject axe-core for automated accessibility testing
    const axeCorePath = path.dirname(require.resolve('axe-core/package.json')) + '/axe.min.js';
    await page.addScriptTag({ path: axeCorePath });
    
    // Run axe-core analysis
    const axeResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run(document, (err: any, results: any) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    // Get page content for additional analysis
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);

    const results: ComplianceResult[] = [];

    // Process each Section 508 requirement
    for (const requirement of section508Requirements) {
      const result: ComplianceResult = {
        requirement: requirement.requirement,
        description: requirement.description,
        status: "Comply",
        issues: [],
        wcagCriteria: requirement.wcagCriteria,
        section508Reference: requirement.section508Reference
      };

      // Check specific requirements based on WCAG criteria
      switch (requirement.id) {
        case "1.1.1": // Non-text Content
          const imagesWithoutAlt = $('img:not([alt])').length;
          const imagesWithEmptyAlt = $('img[alt=""]').length;
          const decorativeImages = $('img[alt=""]').length;
          
          if (imagesWithoutAlt > 0) {
            result.status = "Do Not Comply";
            result.issues.push(`${imagesWithoutAlt} images missing alt attributes`);
          }
          break;

        case "1.4.3": // Contrast (Minimum)
          // This would need more sophisticated analysis of computed styles
          const axeColorContrastViolations = (axeResults as any).violations.filter(
            (v: any) => v.id === 'color-contrast'
          );
          if (axeColorContrastViolations.length > 0) {
            result.status = "Do Not Comply";
            result.issues.push(`${axeColorContrastViolations.length} color contrast violations found`);
          }
          break;

        case "2.4.2": // Page Titled
          const title = $('title').text().trim();
          if (!title || title.length === 0) {
            result.status = "Do Not Comply";
            result.issues.push("Page missing title element");
          } else if (title.length < 3) {
            result.status = "Partially Comply";
            result.issues.push("Page title is too short to be descriptive");
          }
          break;

        case "3.1.1": // Language of Page
          const lang = $('html').attr('lang');
          if (!lang) {
            result.status = "Do Not Comply";
            result.issues.push("HTML element missing lang attribute");
          }
          break;

        case "2.1.1": // Keyboard
          const elementsWithTabindex = $('[tabindex]').length;
          const negativeTabindex = $('[tabindex="-1"]').length;
          if (negativeTabindex > elementsWithTabindex * 0.5) {
            result.status = "Partially Comply";
            result.issues.push("Many elements have negative tabindex, may affect keyboard navigation");
          }
          break;

        case "1.3.1": // Info and Relationships
          const headings = $('h1, h2, h3, h4, h5, h6').length;
          const h1Count = $('h1').length;
          if (h1Count === 0) {
            result.status = "Partially Comply";
            result.issues.push("No H1 heading found on page");
          } else if (h1Count > 1) {
            result.status = "Partially Comply";
            result.issues.push("Multiple H1 headings found, should have only one");
          }
          break;

        case "2.4.1": // Bypass Blocks
          const skipLinks = $('a[href^="#"]').filter(function() {
            return $(this).text().toLowerCase().includes('skip');
          }).length;
          if (skipLinks === 0) {
            result.status = "Do Not Comply";
            result.issues.push("No skip navigation links found");
          }
          break;

        case "3.3.2": // Labels or Instructions
          const inputsWithoutLabels = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').filter(function() {
            const id = $(this).attr('id');
            const hasLabel = id && $(`label[for="${id}"]`).length > 0;
            const hasAriaLabel = $(this).attr('aria-label');
            const hasAriaLabelledby = $(this).attr('aria-labelledby');
            return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
          }).length;
          
          if (inputsWithoutLabels > 0) {
            result.status = "Do Not Comply";
            result.issues.push(`${inputsWithoutLabels} form inputs missing labels`);
          }
          break;

        default:
          // Check if this requirement is covered by axe-core
          const axeViolations = (axeResults as any).violations.filter((v: any) => 
            v.tags.includes('wcag' + requirement.id.replace(/\./g, ''))
          );
          if (axeViolations.length > 0) {
            result.status = "Do Not Comply";
            result.issues.push(`${axeViolations.length} violations detected by automated testing`);
          }
          break;
      }

      // If no issues found but axe-core has related violations, mark as partially compliant
      if (result.status === "Comply" && result.issues.length === 0) {
        const relatedAxeViolations = (axeResults as any).violations.filter((v: any) => 
          v.tags.some((tag: string) => tag.includes(requirement.id.replace(/\./g, '')))
        );
        if (relatedAxeViolations.length > 0) {
          result.status = "Partially Comply";
          result.issues.push("Some related issues detected by automated testing");
        }
      }

      results.push(result);
    }

    return results;
}

// Legacy function for backward compatibility - analyzes single webpage
async function analyzeWebpage(url: string, auth: AuthenticationOptions = { type: "none" }): Promise<ComplianceResult[]> {
  const results = await analyzeMultipleWebpages(url, auth, { enabled: false });
  return results.length > 0 ? results[0].complianceResults : [];
}

// Function to generate CSV report for multiple pages
async function generateMultiPageCSVReport(pageResults: PageAnalysisResult[], outputPath: string): Promise<string> {
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'pageUrl', title: 'Page URL' },
      { id: 'pageTitle', title: 'Page Title' },
      { id: 'requirement', title: 'Requirement' },
      { id: 'description', title: 'Description' },
      { id: 'wcagCriteria', title: 'WCAG Criteria' },
      { id: 'section508Reference', title: 'Section 508 Reference' },
      { id: 'status', title: 'Compliance Status' },
      { id: 'issues', title: 'Issues Found' }
    ]
  });

  // Flatten all results from all pages
  const records = pageResults.flatMap(page => 
    page.complianceResults.map(result => ({
      pageUrl: page.url,
      pageTitle: page.title,
      requirement: result.requirement,
      description: result.description,
      wcagCriteria: result.wcagCriteria,
      section508Reference: result.section508Reference,
      status: result.status,
      issues: result.issues.join('; ')
    }))
  );

  await csvWriter.writeRecords(records);
  return outputPath;
}

// Function to generate CSV report
async function generateCSVReport(results: ComplianceResult[], outputPath: string, pageUrl: string): Promise<string> {
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'pageUrl', title: 'Page URL' },
      { id: 'requirement', title: 'Requirement' },
      { id: 'description', title: 'Description' },
      { id: 'wcagCriteria', title: 'WCAG Criteria' },
      { id: 'section508Reference', title: 'Section 508 Reference' },
      { id: 'status', title: 'Compliance Status' },
      { id: 'issues', title: 'Issues Found' }
    ]
  });

  const records = results.map(result => ({
    pageUrl: pageUrl,
    requirement: result.requirement,
    description: result.description,
    wcagCriteria: result.wcagCriteria,
    section508Reference: result.section508Reference,
    status: result.status,
    issues: result.issues.join('; ')
  }));

  await csvWriter.writeRecords(records);
  return outputPath;
}

// Tool: Check website accessibility with multi-page crawling support
server.tool(
  "check_website_accessibility",
  "Analyze a webpage or website for Section 508 accessibility compliance with optional authentication and multi-page crawling support",
  {
    url: z.string().describe("URL of the webpage or website to analyze for accessibility compliance"),
    authentication: z.object({
      type: z.enum(["none", "basic", "sso", "form"]).default("none").describe("Type of authentication required"),
      username: z.string().optional().describe("Username for authentication"),
      password: z.string().optional().describe("Password for authentication"),
      ssoProvider: z.enum(["microsoft", "google", "okta", "saml", "other"]).optional().describe("SSO provider type"),
      ssoUrl: z.string().optional().describe("SSO login URL"),
      usernameSelector: z.string().optional().describe("CSS selector for username field"),
      passwordSelector: z.string().optional().describe("CSS selector for password field"),
      submitSelector: z.string().optional().describe("CSS selector for submit button"),
      waitForSelector: z.string().optional().describe("CSS selector to wait for after login"),
      cookies: z.array(z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string().optional()
      })).optional().describe("Cookies to set for authentication")
    }).optional().describe("Authentication configuration for protected pages"),
    crawling: z.object({
      enabled: z.boolean().default(false).describe("Enable multi-page crawling"),
      maxPages: z.number().optional().describe("Maximum number of pages to analyze (default: 50)"),
      maxDepth: z.number().optional().describe("Maximum crawl depth (default: 3)"),
      includePaths: z.array(z.string()).optional().describe("URL paths to include (e.g., ['/products/', '/services/'])"),
      excludePaths: z.array(z.string()).optional().describe("URL paths to exclude (e.g., ['/admin/', '/api/'])"),
      sameOriginOnly: z.boolean().default(true).describe("Only crawl pages from the same domain"),
      followExternalLinks: z.boolean().default(false).describe("Follow links to external domains")
    }).optional().describe("Multi-page crawling configuration")
  },
  async ({ url, authentication = { type: "none" }, crawling = { enabled: false } }) => {
    try {
      // Validate URL
      new URL(url);
      
      const pageResults = await analyzeMultipleWebpages(url, authentication as AuthenticationOptions, crawling as CrawlingOptions);
      
      // Flatten all compliance results
      const allResults = pageResults.flatMap(page => 
        page.complianceResults.map(result => ({
          ...result,
          pageUrl: page.url,
          pageTitle: page.title
        }))
      );
      
      // Count compliance statuses across all pages
      const statusCounts = allResults.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summary = {
        startUrl: url,
        pagesAnalyzed: pageResults.length,
        totalRequirements: allResults.length,
        authenticationUsed: authentication.type !== "none",
        crawlingEnabled: crawling.enabled,
        comply: statusCounts["Comply"] || 0,
        doNotComply: statusCounts["Do Not Comply"] || 0,
        partiallyComply: statusCounts["Partially Comply"] || 0,
        doesNotApply: statusCounts["Does Not Apply"] || 0,
        overallComplianceRate: Math.round((statusCounts["Comply"] || 0) / allResults.length * 100)
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary,
              pageResults: pageResults.map(page => ({
                url: page.url,
                title: page.title,
                complianceRate: Math.round((page.complianceResults.filter(r => r.status === "Comply").length / page.complianceResults.length) * 100),
                issueCount: page.complianceResults.filter(r => r.issues.length > 0).length
              })),
              detailedResults: allResults.slice(0, 20), // Show first 20 detailed results
              message: crawling.enabled 
                ? "Use 'generate_compliance_report' tool to get a complete CSV report for all analyzed pages"
                : "Use 'generate_compliance_report' tool to get a complete CSV report"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing webpage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool: Generate compliance report with multi-page support
server.tool(
  "generate_compliance_report",
  "Generate a detailed CSV report of Section 508 compliance for a webpage or website with optional authentication and multi-page crawling support",
  {
    url: z.string().describe("URL of the webpage or website to analyze"),
    outputPath: z.string().optional().describe("Path where to save the CSV report (optional, defaults to current directory)"),
    authentication: z.object({
      type: z.enum(["none", "basic", "sso", "form"]).default("none").describe("Type of authentication required"),
      username: z.string().optional().describe("Username for authentication"),
      password: z.string().optional().describe("Password for authentication"),
      ssoProvider: z.enum(["microsoft", "google", "okta", "saml", "other"]).optional().describe("SSO provider type"),
      ssoUrl: z.string().optional().describe("SSO login URL"),
      usernameSelector: z.string().optional().describe("CSS selector for username field"),
      passwordSelector: z.string().optional().describe("CSS selector for password field"),
      submitSelector: z.string().optional().describe("CSS selector for submit button"),
      waitForSelector: z.string().optional().describe("CSS selector to wait for after login"),
      cookies: z.array(z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string().optional()
      })).optional().describe("Cookies to set for authentication")
    }).optional().describe("Authentication configuration for protected pages"),
    crawling: z.object({
      enabled: z.boolean().default(false).describe("Enable multi-page crawling"),
      maxPages: z.number().optional().describe("Maximum number of pages to analyze (default: 50)"),
      maxDepth: z.number().optional().describe("Maximum crawl depth (default: 3)"),
      includePaths: z.array(z.string()).optional().describe("URL paths to include (e.g., ['/products/', '/services/'])"),
      excludePaths: z.array(z.string()).optional().describe("URL paths to exclude (e.g., ['/admin/', '/api/'])"),
      sameOriginOnly: z.boolean().default(true).describe("Only crawl pages from the same domain"),
      followExternalLinks: z.boolean().default(false).describe("Follow links to external domains")
    }).optional().describe("Multi-page crawling configuration")
  },
  async ({ url, outputPath, authentication = { type: "none" }, crawling = { enabled: false } }) => {
    try {
      // Validate URL
      new URL(url);
      
      const pageResults = await analyzeMultipleWebpages(url, authentication as AuthenticationOptions, crawling as CrawlingOptions);
      
      // Generate filename if not provided
      const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const authSuffix = authentication.type !== "none" ? `_auth_${authentication.type}` : "";
      const crawlSuffix = crawling.enabled ? `_crawl_${pageResults.length}pages` : "";
      const filename = `508_compliance_${hostname}${authSuffix}${crawlSuffix}_${timestamp}.csv`;
      const fullPath = outputPath ? path.join(outputPath, filename) : filename;
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Flatten all compliance results and generate CSV
      const allResults = pageResults.flatMap(page => 
        page.complianceResults.map(result => ({
          ...result,
          pageUrl: page.url,
          pageTitle: page.title
        }))
      );

      const csvPath = await generateMultiPageCSVReport(pageResults, fullPath);
      
      // Count compliance statuses across all pages
      const statusCounts = allResults.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "Section 508 compliance report generated successfully",
              reportPath: csvPath,
              authenticationUsed: authentication.type !== "none",
              crawlingEnabled: crawling.enabled,
              summary: {
                startUrl: url,
                pagesAnalyzed: pageResults.length,
                totalRequirements: allResults.length,
                comply: statusCounts["Comply"] || 0,
                doNotComply: statusCounts["Do Not Comply"] || 0,
                partiallyComply: statusCounts["Partially Comply"] || 0,
                doesNotApply: statusCounts["Does Not Apply"] || 0,
                overallComplianceRate: Math.round((statusCounts["Comply"] || 0) / allResults.length * 100)
              }
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool: Test authentication
server.tool(
  "test_authentication",
  "Test authentication methods for a webpage to verify login credentials work before running accessibility analysis",
  {
    url: z.string().describe("URL of the webpage to test authentication on"),
    authentication: z.object({
      type: z.enum(["basic", "sso", "form"]).describe("Type of authentication to test"),
      username: z.string().optional().describe("Username for authentication"),
      password: z.string().optional().describe("Password for authentication"),
      ssoProvider: z.enum(["microsoft", "google", "okta", "saml", "other"]).optional().describe("SSO provider type"),
      ssoUrl: z.string().optional().describe("SSO login URL"),
      usernameSelector: z.string().optional().describe("CSS selector for username field"),
      passwordSelector: z.string().optional().describe("CSS selector for password field"),
      submitSelector: z.string().optional().describe("CSS selector for submit button"),
      waitForSelector: z.string().optional().describe("CSS selector to wait for after login"),
      cookies: z.array(z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string().optional()
      })).optional().describe("Cookies to set for authentication")
    }).describe("Authentication configuration to test"),
  },
  async ({ url, authentication }) => {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const beforeAuth = {
        url: page.url(),
        title: await page.title(),
        hasLoginElements: await page.evaluate(() => {
          const loginKeywords = ['login', 'signin', 'sign-in', 'password', 'username', 'email'];
          return loginKeywords.some(keyword => 
            document.body.innerHTML.toLowerCase().includes(keyword)
          );
        })
      };
      
      // Attempt authentication
      await authenticateIfNeeded(page, authentication as AuthenticationOptions);
      
      const afterAuth = {
        url: page.url(),
        title: await page.title(),
        hasUserElements: await page.evaluate(() => {
          const userKeywords = ['logout', 'sign out', 'dashboard', 'profile', 'user', 'account'];
          return userKeywords.some(keyword => 
            document.body.innerHTML.toLowerCase().includes(keyword)
          );
        })
      };
      
      const authenticationSuccess = 
        beforeAuth.url !== afterAuth.url || 
        beforeAuth.title !== afterAuth.title ||
        afterAuth.hasUserElements;
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: authenticationSuccess,
              authType: authentication.type,
              beforeAuth,
              afterAuth,
              message: authenticationSuccess 
                ? "Authentication appears to have succeeded" 
                : "Authentication may have failed or page didn't change as expected"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error testing authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    } finally {
      await browser.close();
    }
  }
);

// Tool: Get accessibility guidelines
server.tool(
  "get_accessibility_guidelines",
  "Get information about Section 508 accessibility requirements and guidelines",
  {
    category: z.enum(["all", "perceivable", "operable", "understandable", "robust"]).optional().describe("Category of guidelines to retrieve"),
  },
  async ({ category = "all" }) => {
    let filteredRequirements = section508Requirements;

    if (category !== "all") {
      const categoryMap: Record<string, string[]> = {
        perceivable: ["1.1", "1.2", "1.3", "1.4"],
        operable: ["2.1", "2.2", "2.3", "2.4"],
        understandable: ["3.1", "3.2", "3.3"],
        robust: ["4.1"]
      };

      const categoryPrefixes = categoryMap[category] || [];
      filteredRequirements = section508Requirements.filter(req =>
        categoryPrefixes.some(prefix => req.id.startsWith(prefix))
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            category: category === "all" ? "All Section 508 Requirements" : `${category.charAt(0).toUpperCase() + category.slice(1)} Requirements`,
            description: "These requirements are based on WCAG 2.0 Level A and AA success criteria as required by Section 508",
            requirements: filteredRequirements,
            totalCount: filteredRequirements.length,
            reference: "Based on Section 508 of the Rehabilitation Act (29 U.S.C. §794d) and WCAG 2.0 Level A and AA"
          }, null, 2),
        },
      ],
    };
  }
);

export { server };