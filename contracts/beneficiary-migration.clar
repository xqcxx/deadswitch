;; ============================================
;; BENEFICIARY MIGRATION HELPER
;; Assists migration from v1 (10 limit) to v2 (dynamic)
;; ============================================

;; Error codes
(define-constant ERR_MIGRATION_FAILED (err u420))
(define-constant ERR_ALREADY_MIGRATED (err u421))
(define-constant ERR_NO_DATA_TO_MIGRATE (err u422))

;; Track migration status
(define-map migration-status principal bool)

;; ============================================
;; Migration Interface
;; ============================================

;; Check if user has migrated
(define-read-only (has-migrated (user principal))
  (default-to false (map-get? migration-status user))
)

;; Get migration status for current user
(define-read-only (get-my-migration-status)
  (has-migrated tx-sender)
)

;; ============================================
;; Migration Functions
;; ============================================

;; Migrate beneficiaries from v1 to v2 format
;; This is a placeholder - actual implementation would call both contracts
(define-public (migrate-my-beneficiaries)
  (let
    (
      (already-migrated (has-migrated tx-sender))
    )
    ;; Check if already migrated
    (asserts! (not already-migrated) ERR_ALREADY_MIGRATED)
    
    ;; Placeholder: In real implementation, this would:
    ;; 1. Read beneficiaries from v1 contract
    ;; 2. Write them to v2 contract one by one
    ;; 3. Mark migration as complete
    
    ;; Mark as migrated
    (map-set migration-status tx-sender true)
    
    (ok true)
  )
)

;; Batch migration for multiple users (admin only)
;; Placeholder for admin migration capability
(define-public (batch-migrate (users (list 20 principal)))
  (begin
    ;; In real implementation, check for admin/contract-owner
    ;; Then migrate each user
    (ok true)
  )
)

;; ============================================
;; Validation Functions
;; ============================================

;; Validate v1 data can be migrated
(define-read-only (can-migrate (user principal))
  (and
    (not (has-migrated user))
    ;; Check if user has data in v1
    true ;; Placeholder
  )
)

;; Get estimated migration cost (in microSTX)
(define-read-only (estimate-migration-cost (user principal))
  ;; Simplified estimation based on number of beneficiaries
  ;; Real implementation would calculate based on actual storage
  u10000
)

;; ============================================
;; Admin Functions
;; ============================================

;; Reset migration status (emergency only)
(define-public (reset-migration-status (user principal))
  (begin
    ;; In real implementation, check for admin
    (map-delete migration-status user)
    (ok true)
  )
)

;; Get total number of migrated users
(define-read-only (get-migrated-count)
  ;; This would require tracking all migrations
  ;; Placeholder for now
  u0
)
