# Beneficiary Manager V2 - Dynamic Storage

This document describes the upgraded beneficiary management system that removes the 10-beneficiary limit.

## Overview

The original `beneficiary-mgr.clar` used Clarity's list type with a fixed limit of 10 beneficiaries:

```clarity
(define-map beneficiaries principal (list 10 {
  recipient: principal,
  percentage: uint
}))
```

This was a hard limit that couldn't be exceeded. **Beneficiary Manager V2** replaces this with a dynamic storage system that supports up to **1,000 beneficiaries per user**.

## Key Changes

### V1 (Old System)
- ✗ Maximum 10 beneficiaries
- ✗ Stored as a single list in one map entry
- ✗ Required reading entire list for any operation
- ✓ Simple implementation

### V2 (New System)
- ✓ Maximum 1,000 beneficiaries
- ✓ Each beneficiary stored separately
- ✓ Efficient individual lookups
- ✓ Pagination support for large lists
- ✓ Incremental updates

## Architecture

### Data Structures

**Individual Beneficiary Records**
```clarity
(define-map beneficiary-records 
  { owner: principal, index: uint } 
  { recipient: principal, percentage: uint }
)
```

Each beneficiary is stored separately with a composite key of `(owner, index)`.

**Beneficiary Count Tracking**
```clarity
(define-map beneficiary-counts principal uint)
```

Tracks total number of beneficiaries per owner.

**Total Percentage Tracking**
```clarity
(define-map beneficiary-totals principal uint)
```

Maintains running total of allocated percentages for validation.

## API Reference

### Write Functions

#### `add-beneficiary`
Add a single beneficiary.

```clarity
(add-beneficiary (recipient principal) (percentage uint))
```

**Parameters:**
- `recipient`: Principal address of beneficiary
- `percentage`: Percentage allocation (0-100)

**Returns:** `(ok true)` or error

**Errors:**
- `ERR_MAX_BENEFICIARIES_REACHED (u416)`: Already at 1,000 beneficiaries
- `ERR_INVALID_PERCENTAGE (u413)`: Total would exceed 100%

**Example:**
```clarity
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND u50)
```

#### `remove-beneficiary`
Remove a beneficiary by index.

```clarity
(remove-beneficiary (index uint))
```

**Parameters:**
- `index`: Zero-based index of beneficiary to remove

**Returns:** `(ok true)` or error

**Errors:**
- `ERR_INVALID_INDEX (u417)`: Index out of bounds
- `ERR_BENEFICIARY_NOT_FOUND (u415)`: No beneficiary at index

#### `clear-beneficiaries`
Remove all beneficiaries.

```clarity
(clear-beneficiaries)
```

**Returns:** `(ok true)`

### Read Functions

#### `get-beneficiary-at`
Get beneficiary at specific index.

```clarity
(get-beneficiary-at (owner principal) (index uint))
```

**Returns:** `(some { recipient: principal, percentage: uint })` or `none`

#### `get-beneficiary-count`
Get total number of beneficiaries.

```clarity
(get-beneficiary-count (owner principal))
```

**Returns:** `uint` (0 to 1,000)

#### `get-total-percentage-read`
Get total percentage allocated.

```clarity
(get-total-percentage-read (owner principal))
```

**Returns:** `uint` (0 to 100)

#### `is-configuration-complete`
Check if beneficiary configuration totals 100%.

```clarity
(is-configuration-complete (owner principal))
```

**Returns:** `bool`

#### `get-remaining-percentage`
Get remaining percentage available.

```clarity
(get-remaining-percentage (owner principal))
```

**Returns:** `uint` (0 to 100)

#### `get-beneficiaries-page`
Get beneficiaries with pagination.

```clarity
(get-beneficiaries-page (owner principal) (page uint))
```

**Returns:**
```clarity
{
  page: uint,
  total-count: uint,
  has-more: bool,
  beneficiaries: (list)
}
```

**Page size:** 50 beneficiaries per page

## Migration Guide

### For Users

**Step 1: Check Migration Status**
```clarity
(contract-call? .beneficiary-migration get-my-migration-status)
```

**Step 2: Migrate Your Beneficiaries**
```clarity
(contract-call? .beneficiary-migration migrate-my-beneficiaries)
```

**Step 3: Verify Migration**
```clarity
(contract-call? .beneficiary-mgr-v2 get-beneficiary-count tx-sender)
```

### For Developers

**Before Migration:**
```clarity
;; V1 API
(contract-call? .beneficiary-mgr set-beneficiaries 
  (list 
    { recipient: addr1, percentage: u50 }
    { recipient: addr2, percentage: u50 }
  )
)
```

**After Migration:**
```clarity
;; V2 API - Add incrementally
(contract-call? .beneficiary-mgr-v2 add-beneficiary addr1 u50)
(contract-call? .beneficiary-mgr-v2 add-beneficiary addr2 u50)
```

## Performance Considerations

### Gas Costs

| Operation | V1 Cost | V2 Cost | Notes |
|-----------|---------|---------|-------|
| Add 1 beneficiary | Medium | Low | V2 more efficient for small updates |
| Add 10 beneficiaries | Medium | Medium | Similar cost |
| Read all beneficiaries | Low | Medium | V2 requires iteration |
| Update 1 beneficiary | High | Low | V2 only touches one record |

### Best Practices

**For Small Lists (< 10 beneficiaries):**
- Use `add-beneficiary` for individual additions
- Read all at once with `get-beneficiaries-page(owner, 0)`

**For Large Lists (> 10 beneficiaries):**
- Use pagination when reading: `get-beneficiaries-page`
- Add in batches if possible
- Cache beneficiary count locally

**For Updates:**
- Remove and re-add is simpler than update-in-place
- Clear and rebuild if making many changes

## Examples

### Complete Setup Example

```clarity
;; Add 5 beneficiaries
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST1... u20)
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST2... u20)
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST3... u20)
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST4... u20)
(contract-call? .beneficiary-mgr-v2 add-beneficiary 'ST5... u20)

;; Verify completion
(contract-call? .beneficiary-mgr-v2 is-configuration-complete tx-sender)
;; => true

;; Get first page of beneficiaries
(contract-call? .beneficiary-mgr-v2 get-beneficiaries-page tx-sender u0)
```

### Pagination Example

```clarity
;; Get page 0 (beneficiaries 0-49)
(let ((page0 (contract-call? .beneficiary-mgr-v2 get-beneficiaries-page user u0)))
  (if (get has-more page0)
    ;; Get page 1 (beneficiaries 50-99)
    (contract-call? .beneficiary-mgr-v2 get-beneficiaries-page user u1)
    page0
  )
)
```

## Limitations

### Current Limitations

1. **Maximum 1,000 beneficiaries** per owner
   - This is a safety limit to prevent unbounded storage
   - Can be increased if needed

2. **Remove operation doesn't shift indexes**
   - Removed slots leave gaps
   - Use `clear-beneficiaries` and rebuild for major reorganization

3. **No batch operations yet**
   - Each beneficiary must be added individually
   - Future version will support batch adds

### Workarounds

**For > 1,000 beneficiaries:**
- Create multiple switches with different beneficiary groups
- Use a hierarchical distribution (intermediary addresses)

**For efficient bulk operations:**
- Use the migration contract for one-time transfers
- Clear and rebuild rather than many individual updates

## Security Considerations

### Percentage Validation
- Total allocation cannot exceed 100%
- Each operation validates running total
- Prevents configuration errors

### Owner Isolation
- Each owner's beneficiaries stored separately
- No cross-owner access possible
- Index namespace is per-owner

### Migration Safety
- Migration status tracked per user
- Prevents double migration
- Original V1 data remains intact during migration

## Troubleshooting

### Common Issues

**Error: ERR_INVALID_PERCENTAGE (u413)**
- Total allocation exceeds 100%
- Check remaining: `get-remaining-percentage`
- Solution: Adjust percentages or remove beneficiaries

**Error: ERR_MAX_BENEFICIARIES_REACHED (u416)**
- Already at 1,000 beneficiaries
- Solution: Remove unused beneficiaries or create new switch

**Error: ERR_INVALID_INDEX (u417)**
- Index doesn't exist
- Check count: `get-beneficiary-count`
- Indexes are 0-based

### Debugging

**Check current state:**
```clarity
(contract-call? .beneficiary-mgr-v2 get-beneficiary-count tx-sender)
(contract-call? .beneficiary-mgr-v2 get-total-percentage-read tx-sender)
(contract-call? .beneficiary-mgr-v2 get-remaining-percentage tx-sender)
```

**Verify specific beneficiary:**
```clarity
(contract-call? .beneficiary-mgr-v2 get-beneficiary-at tx-sender u0)
```

## Roadmap

### Future Enhancements

- [ ] Batch add/remove operations
- [ ] Index compaction after removals
- [ ] Beneficiary metadata (names, notes)
- [ ] Time-based beneficiary activation
- [ ] Conditional distributions
- [ ] Multi-token beneficiary allocations
