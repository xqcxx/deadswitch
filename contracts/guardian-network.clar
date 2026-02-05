;; ============================================
;; GUARDIAN NETWORK - Trusted Timer Extenders
;; Clarity 4 Smart Contract
;; ============================================

(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_TOO_EARLY (err u403))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_EXISTS (err u409))
(define-constant ERR_MAX_EXTENSIONS (err u429))

(define-constant EXTENSION_WINDOW_BLOCKS u144) ;; ~1 day
(define-constant MAX_EXTENSIONS_PER_GUARDIAN u10)

(define-map guardians { user: principal, guardian: principal } bool)
(define-map extension-counts { user: principal, guardian: principal } uint)

(define-public (add-guardian (guardian principal))
  (begin
    (asserts! (not (is-eq guardian tx-sender)) (err u400))
    (asserts! (is-none (map-get? guardians { user: tx-sender, guardian: guardian })) ERR_ALREADY_EXISTS)
    (map-set guardians { user: tx-sender, guardian: guardian } true)
    (map-delete extension-counts { user: tx-sender, guardian: guardian }) ;; Reset count
    (ok true)
  )
)

(define-public (remove-guardian (guardian principal))
  (begin
    (asserts! (not (is-eq guardian tx-sender)) (err u400))
    (asserts! (is-some (map-get? guardians { user: tx-sender, guardian: guardian })) ERR_NOT_FOUND)
    (map-delete guardians { user: tx-sender, guardian: guardian })
    (ok true)
  )
)

(define-public (extend-timer (user principal))
  (let
    (
      (current-count (default-to u0 (map-get? extension-counts { user: user, guardian: tx-sender })))
      (deadline-opt (contract-call? .heartbeat-core get-deadline user))
    )
    (asserts! (default-to false (map-get? guardians { user: user, guardian: tx-sender })) ERR_NOT_AUTHORIZED)
    (asserts! (< current-count MAX_EXTENSIONS_PER_GUARDIAN) ERR_MAX_EXTENSIONS)
    
    ;; Verify deadline exists
    (match deadline-opt
      deadline
        (begin
          ;; Only allow extend if within window or already expired
          (if (< burn-block-height deadline)
            (asserts! (< (- deadline burn-block-height) EXTENSION_WINDOW_BLOCKS) ERR_TOO_EARLY)
            true
          )
          
          (map-set extension-counts { user: user, guardian: tx-sender } (+ current-count u1))
          (as-contract (contract-call? .heartbeat-core guardian-pulse user))
        )
      ERR_NOT_FOUND
    )
  )
)

(define-read-only (is-guardian (user principal) (guardian principal))
  (default-to false (map-get? guardians { user: user, guardian: guardian }))
)

(define-read-only (get-extension-count (user principal) (guardian principal))
  (default-to u0 (map-get? extension-counts { user: user, guardian: guardian }))
)
