# Migration Plan: Beneficiary Manager V1 to V2

## Overview

This document outlines the migration strategy from the 10-beneficiary limit system (V1) to the dynamic storage system (V2).

## Timeline

### Phase 1: Preparation (Week 1-2)
- [x] Deploy beneficiary-mgr-v2 contract to testnet
- [x] Deploy beneficiary-migration contract to testnet
- [ ] Test migration with sample data
- [ ] Create migration UI in frontend
- [ ] Document migration process

### Phase 2: Testing (Week 3-4)
- [ ] Internal testing with development team
- [ ] Beta testing with selected users
- [ ] Performance testing with 100+ beneficiaries
- [ ] Security audit of new contracts
- [ ] Gas cost analysis

### Phase 3: Soft Launch (Week 5)
- [ ] Deploy to mainnet
- [ ] Announce migration availability
- [ ] Provide migration guide
- [ ] Monitor for issues
- [ ] Offer migration support

### Phase 4: Migration Period (Week 6-10)
- [ ] Users migrate at their own pace
- [ ] Both V1 and V2 active
- [ ] Weekly migration reports
- [ ] Address user issues

### Phase 5: V1 Deprecation (Week 11+)
- [ ] Announce V1 deprecation date
- [ ] Force-migrate remaining users (with consent)
- [ ] Disable V1 new registrations
- [ ] Archive V1 data

## Migration Strategies

### Strategy 1: User-Initiated Migration (Recommended)

**Pros:**
- Users maintain control
- No forced changes
- Can happen at user's convenience

**Cons:**
- Slower adoption
- Requires user action
- May have stragglers

**Implementation:**
1. User visits migration page
2. Reviews current V1 beneficiaries
3. Clicks "Migrate to V2"
4. Signs transaction
5. V2 beneficiaries populated automatically

### Strategy 2: Automatic Background Migration

**Pros:**
- Seamless experience
- Fast adoption
- No user action needed

**Cons:**
- Requires gas sponsorship
- Privacy concerns
- Potential for errors

**Implementation:**
1. Backend service monitors V1 users
2. Generates migration transactions
3. Submits with sponsored gas
4. Notifies users after completion

### Strategy 3: Hybrid Approach (Chosen)

**Implementation:**
1. Encourage user-initiated migration with UI prompts
2. Provide "Migrate for me" option (user pays gas)
3. Offer gas-sponsored migration for early adopters (first 100)
4. Automatic migration for inactive accounts (with notification)

## Technical Migration Process

### Contract Interaction Flow

```clarity
;; Step 1: Read V1 beneficiaries
(contract-call? .beneficiary-mgr get-beneficiaries user)
;; => (list { recipient: principal, percentage: uint })

;; Step 2: Check migration status
(contract-call? .beneficiary-migration has-migrated user)
;; => false

;; Step 3: Execute migration
(contract-call? .beneficiary-migration migrate-my-beneficiaries)
;; => (ok true)

;; Step 4: Verify in V2
(contract-call? .beneficiary-mgr-v2 get-beneficiary-count user)
;; => 5 (example)
```

### Frontend Migration Flow

```typescript
// 1. Check if migration needed
const needsMigration = await checkMigrationNeeded(userAddress);

if (needsMigration) {
  // 2. Get V1 beneficiaries
  const v1Beneficiaries = await getV1Beneficiaries(userAddress);
  
  // 3. Show migration UI
  showMigrationDialog(v1Beneficiaries);
  
  // 4. User confirms
  if (userConfirms) {
    // 5. Execute migration transaction
    await executeMigration();
    
    // 6. Verify success
    const v2Count = await getV2BeneficiaryCount(userAddress);
    showSuccessMessage(`Migrated ${v2Count} beneficiaries`);
  }
}
```

## Data Preservation

### V1 Data Retention

**Keep V1 data for:**
- Audit trail
- Rollback capability (if needed)
- Historical reference

**Retention period:** 1 year after full migration

**Storage location:** 
- On-chain: V1 contract remains deployed
- Off-chain: Export to IPFS/Arweave for permanent archive

### V2 Data Integrity

**Validation checks:**
- Total beneficiary count matches
- Percentage allocations match
- All recipients preserved
- No duplicate beneficiaries

**Post-migration verification:**
```typescript
function verifyMigration(
  v1Beneficiaries: Beneficiary[],
  v2BeneficiaryCount: number
): boolean {
  // Check count matches
  if (v1Beneficiaries.length !== v2BeneficiaryCount) {
    return false;
  }
  
  // Check each beneficiary exists in V2
  for (let i = 0; i < v1Beneficiaries.length; i++) {
    const v2Beneficiary = await getBeneficiaryAt(userAddress, i);
    if (!v2Beneficiary || 
        v2Beneficiary.recipient !== v1Beneficiaries[i].recipient ||
        v2Beneficiary.percentage !== v1Beneficiaries[i].percentage) {
      return false;
    }
  }
  
  return true;
}
```

## Rollback Plan

### When to Rollback

**Trigger conditions:**
- Critical bug discovered in V2
- Data corruption detected
- Performance issues at scale
- Security vulnerability found

### Rollback Procedure

1. **Immediate Actions:**
   - Pause all V2 migrations
   - Announce rollback to community
   - Disable V2 contract (circuit breaker)

2. **Data Recovery:**
   - V1 data still exists (not deleted)
   - Users continue using V1
   - No data loss

3. **Fix and Redeploy:**
   - Fix V2 contract issues
   - Redeploy as V2.1
   - Resume migrations

**Note:** Because V1 data is never deleted during migration, rollback is always possible.

## Communication Plan

### User Notifications

**Week before migration opens:**
- Blog post announcing V2 features
- Email to all users
- In-app banner

**During migration period:**
- Weekly progress updates
- Migration success stories
- FAQ updates

**After migration:**
- Thank you message
- V2 feature tutorials
- Support resources

### Support Resources

**Documentation:**
- Migration guide (this document)
- Video tutorial
- FAQ section
- Troubleshooting guide

**Support Channels:**
- Discord #migration-help
- Email support
- In-app chat

## Success Metrics

### Key Performance Indicators

**Migration Rate:**
- Target: 80% of users migrated within 4 weeks
- Track: Daily migration count
- Report: Weekly migration dashboard

**Error Rate:**
- Target: < 0.1% failed migrations
- Track: Error logs and user reports
- Action: Immediate investigation of failures

**User Satisfaction:**
- Target: > 4.5/5 satisfaction rating
- Measure: Post-migration survey
- Improve: Based on feedback

### Monitoring

**Automated Alerts:**
- Failed migration attempt
- Data mismatch detected
- Gas cost spike
- V2 contract errors

**Manual Reviews:**
- Weekly migration audit
- Random sample verification
- User feedback review

## Risk Assessment

### High Risk

**Data Loss**
- Mitigation: V1 data never deleted
- Backup: Export all V1 data before migration
- Testing: Extensive testnet validation

**Contract Bug**
- Mitigation: Security audit
- Backup: Circuit breaker in V2
- Testing: 100% test coverage

### Medium Risk

**Poor User Adoption**
- Mitigation: Clear communication and incentives
- Backup: Extend migration period
- Testing: User testing of migration UI

**High Gas Costs**
- Mitigation: Gas optimization in contracts
- Backup: Subsidize first 100 migrations
- Testing: Gas benchmarking

### Low Risk

**UI Confusion**
- Mitigation: Clear migration wizard
- Backup: Video tutorials
- Testing: User testing

## Post-Migration

### Deprecation of V1

**Timeline:**
- Week 11: Announce V1 deprecation
- Week 15: Disable new V1 beneficiaries
- Week 20: Archive V1 data
- Week 24: Full V1 sunset

**Final Actions:**
- Export all V1 data to IPFS
- Create read-only V1 archive
- Update documentation
- Remove V1 from UI

### V2 Optimization

**Phase 1 Improvements:**
- Batch operations
- Index compaction
- Performance tuning

**Phase 2 Features:**
- Beneficiary metadata
- Conditional distributions
- Multi-token support

## Appendix

### Contract Addresses

**Testnet:**
- V1: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.beneficiary-mgr`
- V2: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.beneficiary-mgr-v2`
- Migration: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.beneficiary-migration`

**Mainnet:**
- TBD after deployment

### Gas Cost Estimates

| Operation | V1 Cost | V2 Cost | Notes |
|-----------|---------|---------|-------|
| Read beneficiaries (10) | 1,000 | 5,000 | V2 higher for iteration |
| Add 1 beneficiary | 5,000 | 3,000 | V2 more efficient |
| Migration (10 beneficiaries) | N/A | 30,000 | One-time cost |

### Emergency Contacts

- Lead Developer: [contact info]
- Security Team: [contact info]
- Community Manager: [contact info]
