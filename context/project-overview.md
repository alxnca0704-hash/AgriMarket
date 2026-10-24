## Overview

AgriMarket is a three-role marketplace that connects smallholder farmers
and local producers in the Philippines directly with buyers, with no
middlemen. A seller creates a stall, lists farm goods with per-kilo /
per-bundle pricing and stock, and sets a delivery fee. A buyer browses
shops and products, fills a cart, checks out with a per-seller delivery
fee, pays by Cash on Delivery or GCash, and follows the order through
`pending → confirmed → to-receive → delivered → completed`, with a
refund branch off `delivered`. Sellers manage the catalogue, orders,
earnings, payout requests, and reviews from a dedicated seller area.

An **admin** operates the platform. The admin manages the system GCash
account (QR code and number) used for buyer payments, verifies GCash
payment proofs, reviews return requests against order IDs and payment
references, approves and pays out seller payout requests, and reviews
seller verification. Admins are not
self-signup: they are promoted manually, and every admin action is
enforced server-side and recorded in an audit log.

Sellers submit a ₱2,000 GCash stall security deposit during signup or within
seven days from their stall page. Partial payments are allowed. The deposit
is tracked in a separate ledger and does not change stall visibility, order
acceptance, sales totals, payout eligibility, payout requests, or commissions.
Admins compare each unique reference with GCash, approve the actual received
amount, or reject with a reason. Expired unpaid deposits are flagged overdue;
they do not hide or suspend stalls. Deposit refunds, offsets, and penalties
are outside the current deposit scope.

Sellers select specific orders from eligible earnings and request payout by
submitting their GCash account name and number. Completed, paid orders become eligible after the
24-hour return window; orders with an open return hold remain excluded until
the return is rejected or the refund is recorded. Admins review the request
alongside the stall's location and verification details, then reject with a
reason or record the GCash transfer reference to close the payout. The app
records the transaction but does not move money. Multiple payout requests
may remain pending when they reserve different orders.

GCash payouts deduct a platform commission equal to 5% of the order's item
subtotal; delivery fees are excluded. The order stores its commission rate,
commission amount, and net payout at completion. Each completed GCash order
creates one platform commission record, which is collected when its payout is
recorded as sent or reversed when a return is refunded before payout. COD
orders do not use this payout commission flow.

Completed COD orders accrue a 5% commission on items subtotal, excluding delivery. Accruals are invoiced weekly when the stall total reaches ₱50; smaller balances roll forward. Sellers pay invoices through the configured GCash account, and the allowlisted admin manually reviews each payment. Commission remains separate from seller sales and payout totals.`n`nBuyers and sellers can exchange text messages in one shared conversation per
buyer/seller pair. Buyers can start a conversation from the shops directory or
their order details; either participant can open it from order details. Both
roles return to conversations from a Messages tab in their app shell. Opening
the thread from an order attaches that order as its current context.
Unread messages are counted separately for each participant and shown as a
badge on each role's Messages navigation item. Seller-authored chat messages
display the stall name as the sender label.

Within 24 hours of delivery, buyers can submit a return/refund request with the
order ID, a reason, and 1–5 photos or videos as evidence. Submission
sets the order to `refund-requested` (shown as “Return Requested”) and
places the seller payout on hold through the return and refund process.
The admin reviews by order ID and payment reference, then approves or
rejects with a recorded reason. On approval, the buyer ships goods to the
seller using a trackable courier; the seller confirms receipt and
inspection; the admin records the refund reference and releases the hold.
Evidence files are stored in Cloudinary; the order stores URLs. Returned
goods are not automatically restocked. The admin records the outgoing
refund method (GCash to the buyer's saved mobile number or cash handoff),
the full order amount, and the transfer/receipt reference. COD refunds are
separate outgoing payments after cash collection at delivery.

The product is Philippine-first: addresses are full PSGC
region/province/city/barangay cascades, prices are in PHP peso, mobile
numbers are validated as `+63 9XXXXXXXXX`, and delivery is
courier-handled with per-stall fees.

For GCash, checkout displays the expected amount, configured QR and number,
and a unique payment note. Buyers submit only the transaction reference
number. Admins verify the reference against the expected amount in their
GCash transaction history, then approve or reject with a reason; rejected
payments can be resubmitted with a new reference. The order shows Pending
verification until admin approval. Approval releases the
orders to the seller for confirmation and fulfilment. New submissions
appear in the admin payment queue, and buyers see approval or rejection
in their live order details.

### Roles

| Role | Access | Responsibilities |
|---|---|---|
| **Buyer** | `/home`, `/shops`, `/cart`, `/checkout`, `/orders` | Browse, order, pay (COD or GCash), confirm receipt, request refunds, review |
| **Seller** | Seller area (dashboard, products, orders, earnings, settings) | Manage stall and catalogue, fulfil orders, request payouts |
| **Admin** | `/admin/*` only | Manage GCash QR and number, verify payments, review return requests by order ID and payment reference, approve payouts, review seller verification |

The admin home at `/admin` is the platform dashboard and first admin
navigation item. It summarizes GCash balance ownership, collected and pending
commission, COD receivables, completed sales, review queues, trends, stall
balances, and recent platform activity. Reconciliation is recorded only from
this dashboard; the record is an append-only snapshot.

Roles are mirrored into Convex `users.role` and Clerk `publicMetadata`.
After sign-in, buyers land on `/home`, sellers on the seller dashboard,
and admins on `/admin`.

