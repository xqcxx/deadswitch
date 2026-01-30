;; ============================================
;; TRIGGER ACTIONS - Execution Logic
;; Clarity 4 Smart Contract
;; ============================================

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
              (first-beneficiary (get recipient (unwrap-panic (element-at? beneficiaries u0))))
            )
            ;; 5. Sweep remainder to first beneficiary
            (if (> remainder u0)
              (unwrap-panic (contract-call? .vault distribute-stx user first-beneficiary remainder))
              true
            )
            (ok true)
          )
        )
        (ok true) ;; No funds or no beneficiaries, but trigger state is ensured
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
      (begin
        (unwrap-panic (contract-call? .vault distribute-stx (var-get processing-user) (get recipient item) amount))
        (+ total-so-far amount)
      )
      total-so-far
    )
  )
)
