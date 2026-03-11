/**
 * ISMS Page Import Script
 * Processes the Confluence export JSON and creates MDX files for Nextra docs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// Read the JSON export
const exportPath = process.argv[2] || './confluence-export-ISMS.json';
const outputBase = './docs/app/isms';

// Link replacements map
const linkReplacements = {
  // Azure DevOps links -> Helpdesk references
  'https://dev.azure.com/knowl/ISMS%20security%20and%20HRM/_wiki/wikis/ISMS-security-and-HRM.wiki/1057/Competences': '/helpdesk/isms/competences-roles',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1174/Information-retention-policy': '/helpdesk/isms/information-retention-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1177/Password-policy': '/helpdesk/isms/password-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1190/Supplier-relationship-policy': '/helpdesk/isms/supplier-relationship-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1191/Secure-development-policy': '/helpdesk/isms/secure-development-policy',
  'https://dev.azure.com/knowl/ISMS%20security%20and%20HRM/_wiki/wikis/ISMS-security-and-HRM.wiki/1230/Assets': '/helpdesk/isms/assets-register',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1140/Access-control-policy': '/helpdesk/isms/access-control-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1155/Clean-desk-and-screen-policy': '/helpdesk/isms/clean-desk-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1156/Business-continuity-plan': '/helpdesk/isms/business-continuity-plan',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1163/Information-classification-policy': '/helpdesk/isms/information-classification-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1168/Cryptographic-policy': '/helpdesk/isms/cryptographic-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1054/Information-security-policy': '/helpdesk/isms/information-security-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1181/Testing-policy': '/helpdesk/isms/testing-policy',
  'https://dev.azure.com/medrecord/MEDrecord%20ISMS/_wiki/wikis/MEDrecord-ISMS.wiki/1260/Security-training-and-awareness-policy': '/helpdesk/isms/security-training-policy',
  
  // Broken Atlassian links -> internal ISMS references
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8486968': '/isms/annex-a/a-16-1-2-reporting-security-events',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8490868': '/isms/annex-a/a-7-2-2-security-awareness',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8490892': '/isms/annex-a/a-12-6-1-technical-vulnerabilities',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8490894': '/isms/annex-a/a-16-1-1-responsibilities-procedures',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8490898': '/isms/annex-a/a-16-1-3-reporting-weaknesses',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/8490902': '/isms/annex-a/a-16-1-7-collection-evidence',
  'https://medrecord.atlassian.net/wiki/spaces/ISMS/pages/2010906625/Suppliers': '/isms/registers/suppliers',
};

function cleanContent(content) {
  let cleaned = content;
  
  // Replace Azure wiki page references
  cleaned = cleaned.replace(/\[Azure wiki page\]\([^)]+\)/g, '');
  
  // Replace known links
  for (const [oldLink, newLink] of Object.entries(linkReplacements)) {
    cleaned = cleaned.replaceAll(oldLink, newLink);
  }
  
  // Clean up Confluence macros
  cleaned = cleaned.replace(/INLINE/g, '');
  cleaned = cleaned.replace(/BLOCK/g, '');
  cleaned = cleaned.replace(/truesimple/g, '');
  cleaned = cleaned.replace(/falsesimple/g, '');
  cleaned = cleaned.replace(/:tools:1f6e0[^\n]*/g, '');
  cleaned = cleaned.replace(/\d{10}YYYY-## - No title\d+Register a new change/g, '');
  
  // Clean up empty implement references
  cleaned = cleaned.replace(/- Implement ,\n/g, '');
  cleaned = cleaned.replace(/- Implement  and /g, '');
  cleaned = cleaned.replace(/Implement  and /g, '');
  
  // Clean up badge/label markers
  cleaned = cleaned.replace(/trueBlue/g, '');
  cleaned = cleaned.replace(/trueGreen/g, '');
  cleaned = cleaned.replace(/trueYellow/g, '');
  cleaned = cleaned.replace(/GreenACCEPT/g, '**ACCEPT**');
  cleaned = cleaned.replace(/YellowMitigate/g, '**MITIGATE**');
  cleaned = cleaned.replace(/GreyTransfer/g, '**TRANSFER**');
  cleaned = cleaned.replace(/RedNo/g, 'No');
  cleaned = cleaned.replace(/Greenyes/g, 'Yes');
  cleaned = cleaned.replace(/GreenYes/g, 'Yes');
  
  // Clean control/risk/treatment markers
  cleaned = cleaned.replace(/^control###/gm, '###');
  cleaned = cleaned.replace(/^risk###/gm, '###');
  cleaned = cleaned.replace(/^treatment###/gm, '###');
  cleaned = cleaned.replace(/^check###/gm, '###');
  cleaned = cleaned.replace(/^risk#/gm, '#');
  cleaned = cleaned.replace(/^treatment#/gm, '#');
  
  // Remove page properties macro remnants
  cleaned = cleaned.replace(/label = "control"[^)]*\)/g, '');
  cleaned = cleaned.replace(/label = "selfcheck"[^)]*\)/g, '');
  cleaned = cleaned.replace(/label = "change"[^)]*\)/g, '');
  cleaned = cleaned.replace(/label = "featured"[^)]*\)/g, '');
  cleaned = cleaned.replace(/space = currentSpace \( \)/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

function transformPath(originalPath) {
  // Remove docs/app/docs/isms prefix and page.mdx suffix
  let path = originalPath
    .replace('docs/app/docs/isms/', '')
    .replace('/page.mdx', '');
  
  // Clean up root/home structure
  path = path.replace('root/home/', '');
  
  // Simplify deep nesting
  path = path
    .replace('information-security-management-system/', '')
    .replace('annex-a-controls/', 'annex-a/')
    .replace('supporting-documents/', '')
    .replace('registers/', 'registers/')
    .replace('policies/', 'policies/');
  
  return path;
}

// Main execution
try {
  const jsonContent = readFileSync(exportPath, 'utf-8');
  const pages = JSON.parse(jsonContent);
  
  console.log(`Processing ${pages.length} ISMS pages...`);
  
  let created = 0;
  let skipped = 0;
  
  for (const page of pages) {
    const transformedPath = transformPath(page.path);
    const outputPath = join(outputBase, transformedPath, 'page.mdx');
    const outputDir = dirname(outputPath);
    
    // Skip confluence help pages
    if (transformedPath.includes('confluence-help')) {
      skipped++;
      continue;
    }
    
    // Clean content
    const cleanedContent = cleanContent(page.content);
    
    // Create directory if needed
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write file
    writeFileSync(outputPath, cleanedContent);
    created++;
    console.log(`Created: ${outputPath}`);
  }
  
  console.log(`\nDone! Created ${created} pages, skipped ${skipped}.`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
