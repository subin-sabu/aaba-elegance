# Aaba Elegance 
 A Full Stack Clothing Web Application built using the MERN Stack. This aims to provide a <b>Customized Stitching Service </b> initially and later when there are more customers, serve pre-stitched clothes like any other e-commerce application. Certain <b>features</b> of the app can be <b>toggled ON or OFF</b> from the Admin Dashboard. Only when app is on <b>Full-fledged e-commerce mode</b>, features like stock management, cart, payment gateways, courier services, etc will be available. 

## 0. Opening note
This document describes the complete customer + admin journey and every system action:  
**ENQUIRY → QUOTE → ORDER → DISPATCHED → DELIVERED → REVIEW**.  

It also covers email/SMS messages, legal confirmation links, storage, measurement rules, feature toggles and future behaviour.  
Read straight through — this is the exact intended user experience and admin responsibilities.

---

## 1. Admin: first actions
- Admin logs into the **Admin Panel** with email + password.
- Admin creates the **Shop profile** (name, address, GSTIN if applicable, feature toggles).
- **Feature toggles** include:  
  - `cartEnabled`  
  - `variantsEnabled`  
  - `stockEnabled`  
  - `paymentsEnabled`  
  - `returnsEnabled`  
  - `taxEnabled`  

- Admin creates **categories** (e.g., *Wedding Dresses, Special Occasions*).

- Admin configures **global measurement definitions** (master list) and tags for them (*women, men, children, babies, unisex*).  
  Each definition has:  
  - `code` (e.g., BUST, WAIST)  
  - `label`  
  - `help description`  
  - `help photo path` (used in the frontend guide).

- Admin creates **attribute types & values**:  
  Example: `AttributeType = COLOR`, `AttributeValue = Red, Ivory`.  
  - Today: used as filters.  
  - Future: when `variantsEnabled=true` → same attributes become variant dimensions.

- Admin adds **products**:  
  - Title  
  - Description  
  - Up to 4 product photos  
  - Category  
  - Attributes (e.g., color filter)  
  - Required measurement definitions (only these are asked of users)  
  - Meta/future variant notes  

- Admin sets **upload/size policies** and selects **Cloudinary folder prefix** for media storage.

---

## 2. Product page & what users see
- Product gallery (photos), title, description, category, and attributes (e.g., color filter if present).
- Clear message when product is **custom-made** and price is quoted after **ENQUIRY**.
- A **Customize** button under product details for custom orders.
- **Measurement help images** shown inline beside input fields.
- **Unit selector**: default = cm, toggleable to inches.  
  Stored always in **cm**.

---

## 3. ENQUIRY (user initiates)
When user clicks **Customize**:

- If not logged in → prompted to **Sign Up / Log In**.
- User completes the **ENQUIRY form**:  
  - Required measurements (only those product requires).  
  - Remarks (free text, max 1000 chars).  
  - Upload up to 3 images, max 10 MB each, **images only**.  

- On submission:  
  - System creates an **ENQUIRY record** with `status=ENQUIRY_PLACED`.  
  - Measurements & media are snapshotted.  

- System sends **ENQUIRY confirmation** email & SMS.  

**Email Example**  
```
Subject: Aaba Elegance — Enquiry Received (#ENQ1234)
Body: Thank you! Here are your submitted measurements...
Next steps: Our staff will contact you soon to discuss fabric, price and delivery.
```

**SMS Example**  
```
Enquiry received. We’ll contact you soon. Ref: ENQ1234.
```

---

## 4. Admin: creating & sending QUOTE
- Admin reviews the ENQUIRY (measurements, remarks, images).
- Creates a **QUOTE** tied to ENQUIRY:  
  - `chargeLines`: basePrice, urgentStitchingFee, customFabricCharge, customDesignCharge, embellishmentCharge, alterationCharge, packagingCharge, otherCharge, discount.  
  - `deliveryCharge`  
  - `taxLines[]` if `taxEnabled`  
  - `dispatchDate`, notes (internal + customer-facing)  
  - Snapshots product + measurements (immutable).  

- System computes totals:  
  ```
  subTotal     = sum(chargeLines) - discount
  preTaxTotal  = subTotal + deliveryCharge
  taxTotal     = sum(taxLines)   (0 if tax disabled)
  grandTotal   = preTaxTotal + taxTotal
  ```

- Admin sends secure confirmation link (JWT, expiry 24–48 hrs).  
- System sends **QUOTE_SENT** email + SMS.

**Email Example**  
```
Subject: Aaba Elegance — Quote for your enquiry #ENQ1234 (QUOTE5678)
Body: [full breakdown, dispatch date, terms] 
Button: Confirm & Accept (secure JWT link)
```

---

## 5. User confirms QUOTE → becomes ORDER
- User clicks confirm link.  
- System validates **JWT + expiry**.  
- If logged out → must log in → link remains valid.  
- User checks “**I accept terms & conditions**” → treated as **legal acceptance**.  

System creates **ORDER record** with:  
- `status=ORDER_CONFIRMED`  
- Snapshots of quote + customer  
- `confirmedAt` timestamp  

Sends **ORDER_CONFIRMED** notifications:  
- Email with dispatch ETA  
- SMS (if phone exists)

---

## 6. Production, Dispatch & Tracking
- Admin updates status: `PROCESSING → DISPATCHED`.  
- Records dispatchDate + tracking link/AWB.  
- System sends **DISPATCHED email + SMS** with tracking info.  

---

## 7. Delivery & Invoice PDF
- Admin marks **DELIVERED** when courier confirms.  
- System generates **PDF invoice** with:  
  - Order ID  
  - Billing snapshot  
  - Charge lines  
  - Delivery  
  - Tax (if enabled)  
  - GSTIN (if enabled)  

- Email + SMS with **Invoice PDF** + Review CTA.

---

## 8. REVIEW flow
- User reviews order:  
  - Rating: overall (1–5) + sub-ratings  
  - Text: up to 500 words (if <3 stars → min 300 chars)  
  - Media: up to 3 images (10MB each, compressed)  

- Attempts: max 3 (create + edit + delete).  
- Moderation: all reviews start as `PENDING`.  
- Admin approves/rejects → user notified.

---

## 9. Positive-review media collection
- If review >=4 and approved → system sends **follow-up email** asking for event photos/social tags.  
- Encourages external sharing (Google Drive, social media).  

---

## 10. Media storage & cleanup
- All uploads go to **Cloudinary**.  
- Folder structure:  
  ```
  products/{productId}/
  enquiries/{enquiryId}/
  quotes/{quoteId}/
  orders/{orderId}/reviews/{reviewId}/
  ```

- Cleanup: orphan sweeper removes unused media.

---

## 11. Pricing & Tax rules
- **Charge lines**:  
  - basePrice  
  - urgentStitchingFee  
  - customFabricCharge  
  - customDesignCharge  
  - embellishmentCharge  
  - alterationCharge  
  - packagingCharge  
  - otherCharge  
  - discount  
  - deliveryCharge  

- **Tax**:  
  - If enabled: `taxLines[]` with name, rate, amount  
  - If disabled: invoice shows “price includes all taxes”  

- **Formula**:  
  ```
  subTotal     = sum(chargeLines) - discount
  preTaxTotal  = subTotal + deliveryCharge
  taxTotal     = sum(taxLines)
  grandTotal   = preTaxTotal + taxTotal
  ```

---

## 12. Legal acceptance & JWT
- Quote email contains **signed, expiring JWT link**.  
- User checks “I accept T&Cs” → becomes **legal acceptance**.  
- Records: time, IP, userId.

---

## 13. Courier handling
- Initial rollout: manual tracking entry.  
- Future: integrate **courier APIs** (Blue Dart, Delhivery, India Post).

---

## 14. Products, attributes & variants
- Current: attributes = filters only.  
- Future: `variantsEnabled=true` → `ProductVariant` (color × size × SKU).

---

## 15. Deletion & safety
- Soft-delete with `isActive=false` if references exist.  
- Hard-delete only if no dependencies.  
- Background cleanup removes orphans.

---

## 16. Notifications & Audit Trail
**Email/SMS events:**  
- **ENQUIRY_PLACED**  
- **QUOTE_SENT**  
- **QUOTE_EXPIRED / QUOTE_WITHDRAWN**  
- **ORDER_CONFIRMED**  
- **DISPATCHED**  
- **DELIVERED** (with invoice)  
- **REVIEW_CREATED / REVIEW_EDITED** (admin)  
- **REVIEW_APPROVED / REVIEW_REJECTED** (user)  

All actions logged in **audit trail**.

---

## 17. Abuse & moderation controls
- Rate limits on review submissions.  
- Validate MIME type + file size.  
- Optional profanity filter.  
- Require 300+ chars for negative reviews.  
- Max 3 review attempts/order.

---

## 18. Edge cases & notes
- Product with no price → show “Price quoted after enquiry”.  
- Quotes can expire; Admin can withdraw.  
- Measurement changes → old enquiries remain snapshotted.  
- Encourage **external media sharing** (reduce storage costs).  
- Backend & DB schema support **future ecommerce expansion**.

---

## 19. Summary timeline (User View)
```
Browse product → Customize → Sign up/log in
→ Submit measurements/remarks/images → ENQUIRY_PLACED
→ Receive confirmation email/SMS
→ Admin sends QUOTE with JWT confirm link
→ User accepts T&Cs → ORDER_CONFIRMED
→ Admin marks DISPATCHED (tracking link sent)
→ Admin marks DELIVERED (invoice PDF sent)
→ User leaves REVIEW → Admin moderates
→ If positive, system invites social media sharing
```
