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

Sellers select specific orders from eligible earnings and request payout by
submitting their GCash account name and number. Completed, paid orders become eligible after the
24-hour return window; orders with an open return hold remain excluded until
the return is rejected or the refund is recorded. Admins review the request
alongside the stall's location and verification details, then reject with a
reason or record the GCash transfer reference to close the payout. The app
records the transaction but does not move money. Multiple payout requests
may remain pending when they reserve different orders.

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

Roles are mirrored into Convex `users.role` and Clerk `publicMetadata`.
After sign-in, buyers land on `/home`, sellers on the seller dashboard,
and admins on `/admin`.
