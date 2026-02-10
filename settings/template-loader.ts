/**
 * Template Loader Utility
 * Loads and validates switch configuration templates
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  configuration: TemplateConfiguration;
  beneficiaryDefaults?: BeneficiaryDefaults;
  guardianDefaults?: GuardianDefaults;
  tags?: string[];
}

export interface TemplateConfiguration {
  heartbeatInterval: number;
  guardianExtensionBlocks: number;
  minGuardians: number;
  maxBeneficiaries: number;
  allowPartialWithdrawal?: boolean;
  autoTriggerEnabled?: boolean;
  requireMultiSig?: boolean;
  supportMultipleTokens?: boolean;
  immediateTrigger?: boolean;
  longTermLock?: boolean;
}

export interface BeneficiaryDefaults {
  distributionType: 'equal' | 'custom' | 'weighted';
  defaultPercentage?: number | null;
}

export interface GuardianDefaults {
  maxGuardians?: number;
  extensionLimit?: number;
  allowFamilyGuardians?: boolean;
  requireBusinessVerification?: boolean;
}

export interface Category {
  name: string;
  description: string;
  icon?: string;
}

export interface TemplateRegistry {
  version: string;
  templates: Template[];
  categories: Record<string, Category>;
}

const SETTINGS_DIR = join(process.cwd(), 'settings');

/**
 * Load the template registry
 */
export function loadTemplateRegistry(): TemplateRegistry {
  const templatePath = join(SETTINGS_DIR, 'templates.json');
  const content = readFileSync(templatePath, 'utf-8');
  return JSON.parse(content) as TemplateRegistry;
}

/**
 * Get a specific template by ID
 */
export function getTemplate(id: string): Template | undefined {
  const registry = loadTemplateRegistry();
  return registry.templates.find(t => t.id === id);
}

/**
 * Get all templates in a category
 */
export function getTemplatesByCategory(category: string): Template[] {
  const registry = loadTemplateRegistry();
  return registry.templates.filter(t => t.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): Record<string, Category> {
  const registry = loadTemplateRegistry();
  return registry.categories;
}

/**
 * Get templates by tags
 */
export function getTemplatesByTags(tags: string[]): Template[] {
  const registry = loadTemplateRegistry();
  return registry.templates.filter(t => 
    tags.some(tag => t.tags?.includes(tag))
  );
}

/**
 * Validate a configuration against a template
 */
export function validateConfiguration(
  config: Partial<TemplateConfiguration>,
  template: Template
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const defaults = template.configuration;

  if (config.heartbeatInterval !== undefined) {
    if (config.heartbeatInterval < 144 || config.heartbeatInterval > 52560) {
      errors.push('heartbeatInterval must be between 144 and 52560 blocks');
    }
  }

  if (config.maxBeneficiaries !== undefined) {
    if (config.maxBeneficiaries < 1 || config.maxBeneficiaries > defaults.maxBeneficiaries) {
      errors.push(`maxBeneficiaries must be between 1 and ${defaults.maxBeneficiaries}`);
    }
  }

  if (config.minGuardians !== undefined) {
    if (config.minGuardians < 0 || config.minGuardians > defaults.minGuardians) {
      errors.push(`minGuardians must be between 0 and ${defaults.minGuardians}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Apply template defaults to a partial configuration
 */
export function applyTemplateDefaults(
  config: Partial<TemplateConfiguration>,
  template: Template
): TemplateConfiguration {
  return {
    heartbeatInterval: config.heartbeatInterval ?? template.configuration.heartbeatInterval,
    guardianExtensionBlocks: config.guardianExtensionBlocks ?? template.configuration.guardianExtensionBlocks,
    minGuardians: config.minGuardians ?? template.configuration.minGuardians,
    maxBeneficiaries: config.maxBeneficiaries ?? template.configuration.maxBeneficiaries,
    allowPartialWithdrawal: config.allowPartialWithdrawal ?? template.configuration.allowPartialWithdrawal ?? false,
    autoTriggerEnabled: config.autoTriggerEnabled ?? template.configuration.autoTriggerEnabled ?? true,
    requireMultiSig: config.requireMultiSig ?? template.configuration.requireMultiSig ?? false,
    supportMultipleTokens: config.supportMultipleTokens ?? template.configuration.supportMultipleTokens ?? false,
    immediateTrigger: config.immediateTrigger ?? template.configuration.immediateTrigger ?? false,
    longTermLock: config.longTermLock ?? template.configuration.longTermLock ?? false,
  };
}

/**
 * Get preset configuration
 */
export function loadPresets(type: 'quick-start' | 'advanced'): any {
  const presetPath = join(SETTINGS_DIR, 'presets', `${type}.json`);
  const content = readFileSync(presetPath, 'utf-8');
  return JSON.parse(content);
}

export default {
  loadTemplateRegistry,
  getTemplate,
  getTemplatesByCategory,
  getCategories,
  getTemplatesByTags,
  validateConfiguration,
  applyTemplateDefaults,
  loadPresets
};
