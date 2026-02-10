# Switch Configuration Templates

DeadSwitch provides pre-configured templates to help you quickly set up your dead man's switch with appropriate settings for your use case.

## Available Templates

### Personal Templates

#### Personal - Basic (`personal-basic`)
**Best for**: First-time users with simple needs

- **Heartbeat Interval**: 1440 blocks (~10 days)
- **Guardians**: 1 minimum, 3 maximum
- **Beneficiaries**: Up to 3
- **Features**: Simple equal distribution, no partial withdrawals

**Use this when**: You have one primary beneficiary and want a simple, straightforward setup.

#### Personal - Advanced (`personal-advanced`)
**Best for**: Users with multiple beneficiaries

- **Heartbeat Interval**: 4320 blocks (~30 days)
- **Guardians**: 2 minimum, 5 maximum
- **Beneficiaries**: Up to 5
- **Features**: Custom distribution, partial withdrawals enabled

**Use this when**: You have multiple beneficiaries with different distribution needs.

### Family Templates

#### Family Protection (`family-protection`)
**Best for**: Family asset distribution

- **Heartbeat Interval**: 10080 blocks (~70 days)
- **Guardians**: 1 minimum, 3 maximum
- **Beneficiaries**: Up to 10
- **Features**: Equal distribution, extended guardian limits

**Use this when**: Setting up inheritance for family members with equal shares.

### Business Templates

#### Business Continuity (`business-continuity`)
**Best for**: Business succession planning

- **Heartbeat Interval**: 2880 blocks (~20 days)
- **Guardians**: 3 minimum, 7 maximum
- **Beneficiaries**: Up to 8
- **Features**: Multi-sig required, manual trigger only

**Use this when**: Business assets need controlled transfer with multiple approvals.

### Investment Templates

#### Crypto Investor (`crypto-investor`)
**Best for**: Active crypto investors

- **Heartbeat Interval**: 2160 blocks (~15 days)
- **Guardians**: 1 minimum, 3 maximum
- **Beneficiaries**: Up to 4
- **Features**: Partial withdrawals, multi-token support

**Use this when**: You trade actively and want flexibility with partial access.

### Emergency Templates

#### Emergency Fund (`emergency-fund`)
**Best for**: Quick-access emergency funds

- **Heartbeat Interval**: 720 blocks (~5 days)
- **Guardians**: Optional
- **Beneficiaries**: Up to 2
- **Features**: Fast trigger, immediate access

**Use this when**: Setting aside funds for emergency access with minimal delay.

### Storage Templates

#### Long-term Storage (`long-term-storage`)
**Best for**: Long-term cold storage

- **Heartbeat Interval**: 43200 blocks (~300 days)
- **Guardians**: 1 minimum, 5 maximum
- **Beneficiaries**: Up to 5
- **Features**: Extended lock periods, conservative settings

**Use this when**: HODLing assets with infrequent check-ins needed.

## Template Structure

Each template includes:

```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Template description
  category: string;              // Category (personal, family, etc.)
  configuration: {
    heartbeatInterval: number;   // Blocks between check-ins
    guardianExtensionBlocks: number;
    minGuardians: number;
    maxBeneficiaries: number;
    allowPartialWithdrawal: boolean;
    autoTriggerEnabled: boolean;
    // ... other options
  };
  beneficiaryDefaults: {
    distributionType: string;    // equal, custom, weighted
    defaultPercentage?: number;
  };
  guardianDefaults: {
    maxGuardians: number;
    extensionLimit: number;
  };
  tags: string[];                // Search tags
}
```

## Quick Start Presets

For fastest setup, use our **Quick Start Presets**:

### Single Beneficiary Quick Start
- Estimated time: 2 minutes
- Difficulty: Beginner
- Pre-configured for single beneficiary

### Family Quick Start
- Estimated time: 5 minutes
- Difficulty: Beginner
- Equal distribution for up to 3 family members

### Emergency Fund Quick Start
- Estimated time: 3 minutes
- Difficulty: Beginner
- Fast 5-day heartbeat interval

## Using Templates

### Via Frontend UI

1. Navigate to "Create Switch"
2. Select "Use Template"
3. Choose from available templates
4. Customize settings as needed
5. Complete setup

### Programmatically

```typescript
import { getTemplate, applyTemplateDefaults } from './settings/template-loader';

// Load a template
const template = getTemplate('family-protection');

// Apply with customizations
const config = applyTemplateDefaults({
  maxBeneficiaries: 4,  // Override default
}, template);
```

## Customizing Templates

Templates provide sensible defaults, but you can customize:

- **Heartbeat Interval**: Adjust based on your activity level
- **Beneficiary Count**: Within template limits
- **Guardian Requirements**: Add or remove guardian requirements
- **Distribution Type**: Equal, custom, or weighted

**Note**: Some templates enforce certain settings for security (e.g., business template requires multi-sig).

## Creating Custom Templates

To create a custom template:

1. Copy an existing template from `settings/templates.json`
2. Modify settings for your use case
3. Add to the templates array
4. Validate against `settings/template-schema.json`

Example:
```json
{
  "id": "my-custom-template",
  "name": "My Custom Setup",
  "description": "Description here",
  "category": "personal",
  "configuration": {
    "heartbeatInterval": 2880,
    "guardianExtensionBlocks": 1440,
    "minGuardians": 1,
    "maxBeneficiaries": 3
  },
  "tags": ["custom", "personal"]
}
```

## Template Validation

All templates are validated against the JSON schema at `settings/template-schema.json`. Validation ensures:

- Required fields are present
- Values are within allowed ranges
- Category references are valid
- No duplicate template IDs

Run validation:
```bash
npm run validate-templates
```

## Best Practices

### Choosing a Template

1. **Start Simple**: Use Personal - Basic for your first switch
2. **Consider Your Audience**: Family template for family, Business for business
3. **Frequency Matters**: More active = shorter heartbeat interval
4. **Security Level**: Business > Personal > Emergency (in terms of controls)

### Adjusting Templates

- **Decrease interval** if you're very active
- **Increase interval** for long-term storage
- **Add guardians** for additional security
- **Enable partial withdrawals** for flexibility

## Troubleshooting

### Template Not Found
Ensure the template ID exists in `settings/templates.json`.

### Configuration Errors
Check that your customizations stay within template limits (e.g., don't set beneficiaries higher than max).

### Schema Validation Failures
Validate your template changes:
```bash
npx ajv-cli validate -s settings/template-schema.json -d settings/templates.json
```
