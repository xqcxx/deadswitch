;; ============================================
;; TRIGGER ACTIONS - Execution Logic
;; Clarity 4 Smart Contract
;; ============================================

(define-constant ERR_DISTRIBUTION_FAILED (err u500))
(define-constant ERR_NO_BENEFICIARIES (err u404))

(define-data-var processing-user principal tx-sender)
(define-data-var processing-balance uint u0)

(define-public (execute-trigger (user principal))
  (let
    (
      ;; 1. Attempt to trigger the switch.
      ;; If it returns ERR_SWITCH_TRIGGERED (u410), we proceed (idempotent retry).
      ;; If it returns other errors (e.g. u403 not time), we fail.
      (trigger-result (contract-call? .heartbeat-core try-trigger user))
    )
    (asserts! (or (is-ok trigger-result) (is-eq (unwrap-err-panic trigger-result) u410)) trigger-result)
    
    ;; 2. Get available balance and beneficiaries
    (let
      (
        (balance (contract-call? .vault get-balance user))
        (beneficiaries (contract-call? .beneficiary-mgr get-beneficiaries user))
      )
      
      (if (and (> balance u0) (> (len beneficiaries) u0))
        (begin
          ;; 3. Setup context for distribution
          (var-set processing-user user)
          (var-set processing-balance balance)
          
          ;; 4. Distribute funds and track total
          (let
            (
              (total-distributed (fold distribute-accum beneficiaries u0))
              (remainder (- balance total-distributed))
              (first-beneficiary-opt (element-at? beneficiaries u0))
            )
            ;; 5. Sweep remainder to first beneficiary
            (match first-beneficiary-opt
              first-ben
                (if (> remainder u0)
                  (try! (contract-call? .vault distribute-stx user (get recipient first-ben) remainder))
                  true
                )
              ;; No beneficiaries (shouldn't happen due to check above)
              (asserts! false ERR_NO_BENEFICIARIES)
            )
            
            (print { event: "trigger-executed", user: user, total-distributed: total-distributed, remainder: remainder })
            (ok true)
          )
        )
        (begin
          (print { event: "trigger-executed-no-funds", user: user })
          (ok true)
        )
      )
    )
  )
)

(define-private (distribute-accum (item { recipient: principal, percentage: uint }) (total-so-far uint))
  (let
    (
      (amount (/ (* (var-get processing-balance) (get percentage item)) u100))
    )
    (if (> amount u0)
      (match (contract-call? .vault distribute-stx (var-get processing-user) (get recipient item) amount)
        success (+ total-so-far amount)
        error total-so-far ;; Continue even if one distribution fails
      )
      total-so-far
    )
  )
)
