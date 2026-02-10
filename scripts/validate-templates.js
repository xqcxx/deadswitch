#!/usr/bin/env node

/**
 * Template Validation Script
 * Validates templates.json against template-schema.json
 */

const fs = require('fs');
const path = require('path');

const SETTINGS_DIR = path.join(__dirname, '..', 'settings');
const TEMPLATE_FILE = path.join(SETTINGS_DIR, 'templates.json');
const SCHEMA_FILE = path.join(SETTINGS_DIR, 'template-schema.json');

// Simple JSON schema validation
function validateType(value, type) {
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return typeof value === 'object' && !Array.isArray(value) && value !== null;
  return true;
}

function validateEnum(value, enumValues) {
  return enumValues.includes(value);
}

function validateRange(value, schema) {
  if (schema.minimum !== undefined && value < schema.minimum) {
    return { valid: false, error: `Value ${value} is less than minimum ${schema.minimum}` };
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    return { valid: false, error: `Value ${value} is greater than maximum ${schema.maximum}` };
  }
  return { valid: true };
}

function validateObject(obj, schema, path = '') {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj)) {
        errors.push(`${path}: Missing required field "${field}"`);
      }
    }
  }

  // Validate each property
  if (schema.properties) {
    for (const [key, value] of Object.entries(obj)) {
      const propertySchema = schema.properties[key];
      if (!propertySchema) {
        if (schema.additionalProperties === false) {
          errors.push(`${path}: Unknown property "${key}"`);
        }
        continue;
      }

      const currentPath = path ? `${path}.${key}` : key;
      const typeErrors = validateValue(value, propertySchema, currentPath);
      errors.push(...typeErrors);
    }
  }

  return errors;
}

function validateValue(value, schema, path) {
  const errors = [];

  // Handle null in type array
  if (Array.isArray(schema.type)) {
    const validTypes = schema.type.filter(t => t !== 'null');
    if (value === null && schema.type.includes('null')) {
      return errors;
    }
    if (!validTypes.some(t => validateType(value, t))) {
      errors.push(`${path}: Expected type ${schema.type.join(' or ')}, got ${typeof value}`);
      return errors;
    }
  } else if (schema.type && !validateType(value, schema.type)) {
    errors.push(`${path}: Expected type ${schema.type}, got ${typeof value}`);
    return errors;
  }

  // Check enum
  if (schema.enum && !validateEnum(value, schema.enum)) {
    errors.push(`${path}: Value must be one of [${schema.enum.join(', ')}]`);
  }

  // Check range
  if (schema.type === 'integer' || schema.type === 'number') {
    const rangeResult = validateRange(value, schema);
    if (!rangeResult.valid) {
      errors.push(`${path}: ${rangeResult.error}`);
    }
  }

  // Check string length
  if (schema.type === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: String length ${value.length} is less than minimum ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path}: String length ${value.length} is greater than maximum ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: String does not match pattern ${schema.pattern}`);
    }
  }

  // Validate array items
  if (schema.type === 'array' && schema.items) {
    value.forEach((item, index) => {
      const itemErrors = validateValue(item, schema.items, `${path}[${index}]`);
      errors.push(...itemErrors);
    });
  }

  // Validate object properties
  if (schema.type === 'object' && schema.properties) {
    const objectErrors = validateObject(value, schema, path);
    errors.push(...objectErrors);
  }

  return errors;
}

function validateTemplates() {
  console.log('🔍 Validating templates...\n');

  let templates;
  let schema;

  // Load files
  try {
    templates = JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf8'));
    console.log('✓ Loaded templates.json');
  } catch (error) {
    console.error('❌ Failed to load templates.json:', error.message);
    process.exit(1);
  }

  try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    console.log('✓ Loaded template-schema.json');
  } catch (error) {
    console.error('❌ Failed to load template-schema.json:', error.message);
    process.exit(1);
  }

  const errors = [];

  // Validate version
  if (!/^\d+\.\d+\.\d+$/.test(templates.version)) {
    errors.push('version: Must follow semantic versioning (e.g., 1.0.0)');
  }

  // Validate templates array
  if (!Array.isArray(templates.templates)) {
    errors.push('templates: Must be an array');
  } else {
    const templateIds = new Set();
    
    templates.templates.forEach((template, index) => {
      // Check for duplicate IDs
      if (templateIds.has(template.id)) {
        errors.push(`templates[${index}]: Duplicate template ID "${template.id}"`);
      }
      templateIds.add(template.id);

      // Validate against schema
      const templateSchema = schema.definitions?.template;
      if (templateSchema) {
        const templateErrors = validateObject(template, templateSchema, `templates[${index}]`);
        errors.push(...templateErrors);
      }

      // Validate category exists
      if (template.category && templates.categories && !templates.categories[template.category]) {
        errors.push(`templates[${index}]: Category "${template.category}" not found in categories`);
      }
    });
  }

  // Validate categories
  if (typeof templates.categories !== 'object') {
    errors.push('categories: Must be an object');
  }

  // Report results
  console.log('\n' + '='.repeat(50));
  
  if (errors.length === 0) {
    console.log('✅ All templates validated successfully!');
    console.log(`\nFound ${templates.templates.length} templates in ${Object.keys(templates.categories).length} categories`);
    process.exit(0);
  } else {
    console.log(`❌ Validation failed with ${errors.length} error(s):\n`);
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    process.exit(1);
  }
}

// Run validation
validateTemplates();
