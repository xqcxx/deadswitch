;; ============================================
;; VAULT - Asset & Secret Locker
;; Clarity 4 Smart Contract
;; ============================================

(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_TRIGGERED (err u410))
(define-constant ERR_NOT_TRIGGERED (err u411))
(define-constant ERR_INSUFFICIENT_FUNDS (err u402))

(define-map secrets principal {
  message-hash: (buff 32),
  message-uri: (string-ascii 200)
})

(define-map deposits principal uint)

(define-public (deposit-stx (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender .vault))
    (map-set deposits tx-sender (+ (default-to u0 (map-get? deposits tx-sender)) amount))
    (ok true)
  )
)

(define-public (set-message (hash (buff 32)) (uri (string-ascii 200)))
  (begin
    (map-set secrets tx-sender { message-hash: hash, message-uri: uri })
    (ok true)
  )
)

(define-public (withdraw-stx (amount uint))
  (let
    (
      (user tx-sender)
      (triggered (contract-call? .heartbeat-core is-triggered user))
      (balance (default-to u0 (map-get? deposits user)))
    )
    (asserts! (not triggered) ERR_TRIGGERED)
    (asserts! (<= amount balance) ERR_INSUFFICIENT_FUNDS)
    
    (try! (as-contract (stx-transfer? amount tx-sender user)))
    (map-set deposits user (- balance amount))
    (ok true)
  )
)

;; Called by trigger-actions contract to distribute funds
(define-public (distribute-stx (owner principal) (recipient principal) (amount uint))
  (let
    (
      (triggered (contract-call? .heartbeat-core is-triggered owner))
      (balance (default-to u0 (map-get? deposits owner)))
    )
    (asserts! (is-eq contract-caller .trigger-actions) ERR_NOT_AUTHORIZED)
    (asserts! triggered ERR_NOT_TRIGGERED)
    (asserts! (<= amount balance) ERR_INSUFFICIENT_FUNDS)
    
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (map-set deposits owner (- balance amount))
    (ok true)
  )
)

(define-read-only (get-balance (user principal))
  (default-to u0 (map-get? deposits user))
)

(define-read-only (get-secret (user principal))
  (let ((triggered (contract-call? .heartbeat-core is-triggered user)))
     (if triggered
       (ok (map-get? secrets user))
       (err ERR_NOT_TRIGGERED)
     )
  )
)

;; Owner can always see their own secret
(define-read-only (get-my-secret)
  (ok (map-get? secrets tx-sender))
)
