# Anthola Architecture Overview

## 1. Product overview
Anthola is a full-stack travel and bus-management platform for two main audiences:
- Passengers: search routes, lock seats, create bookings, upload payment proofs, and review trip history.
- Bus owners: manage routes, buses, bookings, payments, coupons, blocks, and tour packages from a dedicated operator dashboard.

The app combines a premium frontend experience with an Express + MongoDB backend and real-time seat updates via Socket.IO.

---

## 2. Main application flow

### A. Public / landing experience
Entry point: the landing page.

User journey:
1. User lands on the home screen.
2. The landing page shows hero content, smart search, featured routes, featured tours, and social proof sections.
3. From there the user can navigate to:
   - Booking flow
   - Tours flow
   - Authentication page
   - Owner dashboard

### B. Passenger flow
Main route: /booking

Passenger journey:
1. User opens the auth screen and logs in or registers.
2. User selects a route and date.
3. User selects available seats.
4. The backend locks the chosen seats temporarily.
5. The user creates a booking.
6. The user uploads payment proof.
7. The payment and booking status are reviewed by the owner.
8. The passenger can view upcoming, completed, and cancelled journeys later.

### C. Bus owner flow
Main route: /dashboard

Owner journey:
1. Owner logs in with a BUS_OWNER account.
2. Owner manages routes and bus information.
3. Owner reviews bookings and payment verification requests.
4. Owner approves or rejects payments.
5. Owner creates coupons and tour packages.
6. Owner blocks seats for external ticketing or operational reasons.
7. Owner exports booking/payment/user data when needed.

---

## 3. Top-level navigation and tabs

### Public navigation links
- Home
- Booking
- Tours
- Login / Register
- Profile (for signed-in users)
- Dashboard (for bus owners)

### Passenger section
- Booking
- Tours
- My journeys
- Payment verification
- Download ticket / trip summary

### Bus owner section
- Dashboard
- Route management
- Booking management
- Payment review
- Coupon management
- Tour package management
- Seat blocking
- Export tools

---

## 4. Frontend architecture

### Core frontend stack
- Vite
- React
- React Router
- TanStack Query for server state
- Zustand for auth state
- HeroUI for UI components
- Socket.IO client for real-time updates
- React Hot Toast for feedback

### Main frontend structure
- App shell: shared layout, header, theme switcher, notifications, logout
- Landing page: marketing and route discovery experience
- Auth page: login, registration, Google auth entry, password recovery
- Passenger page: booking flow, seat selection, payment verification, trip history
- Owner page: operator dashboard with route, booking, payments, tours, coupons, seat-blocking tools

### Frontend component relationships
- The app shell wraps the entire experience and provides shared navigation and notification handling.
- The auth store provides the current logged-in user and JWT token to the whole app.
- The passenger page depends on:
  - route query data
  - seat state data
  - booking mutation actions
  - payment upload actions
- The owner page depends on:
  - owner stats query
  - route query
  - booking and payment queries
  - coupon and tour queries
  - seat-blocking queries
- Both passenger and owner experiences call shared API helpers for authenticated requests.
- Socket events update the UI when seat availability changes.

---

## 5. Backend architecture

### Backend stack
- Express.js
- MongoDB with Mongoose
- JWT authentication and refresh tokens
- Socket.IO server
- Multer and file handling for payment proof uploads
- Nodemailer for password reset emails
- Helmet, rate limiting, and auth middleware for safety

### Backend responsibilities
- Serve the frontend shell and static assets
- Expose REST APIs for auth, bookings, routes, tours, payments, notifications, users, and exports
- Manage seat locking and seat state
- Handle payment verification workflow and admin review
- Sync live updates for seat and booking events

### Main backend modules
- Routes: auth, users, routes, tours, bookings, payments, notifications, owners, exports, seats
- Controllers: auth, bookings, payments, tours, routes, owner, users, notifications, exports, seats
- Models: User, Booking, Route, TourPackage, Payment, Notification, BlockedSeat, SeatLock, RefreshToken, and related entities

---

## 6. Core data model overview

### Users
Represents passengers and bus owners.
Contains identity, role, contact information, account status, and auth-related information.

### Routes
Represents a bus route offered by a bus owner.
Contains origin, destination, bus information, price, duration, seat count, and payment details.

### Bookings
Represents a passenger booking.
Links a user to a route or tour and tracks status, seats, totals, and payment state.

### Payments
Represents payment verification activity.
Tracks provider, reference number, proof image, and review state.

### Tours
Represents package-based travel offerings.
Contains destination, itinerary, price, availability, and booking details.

### Seat state and blocked seats
Controls real-time seat availability and operational blocking.
Needed for the booking experience and owner workflows.

---

## 7. Passenger overview

### Passenger responsibilities
- Register or sign in
- Search routes
- Choose seats
- Create bookings
- Upload payment proof
- Track trip status
- Review journey history

### Passenger experience modules
- Search and route selection
- Seat map selection
- Booking confirmation
- Payment proof upload
- Journey summary cards
- Ticket-related workflow and trip history

### Passenger value proposition
The passenger experience is designed to make booking simple, secure, and guided from first search to payment confirmation.

---

## 8. Bus owner overview

### Bus owner responsibilities
- Create and manage routes
- Configure bus details and pricing
- Review and manage bookings
- Verify and approve payments
- Add coupons
- Create and manage tour packages
- Block seats for operational or external ticketing needs
- Export data for reporting

### Bus owner experience modules
- Dashboard statistics
- Route management form
- Booking review cards
- Payment review panel
- Coupon management
- Tour package management
- Seat-blocking panel
- Export actions

### Bus owner value proposition
The owner workspace centralizes operational control so bus owners can run routes, payments, and bookings from one place.

---

## 9. Component and connection map

### Shared shell
- Header and navigation
- Theme switcher
- User identity display
- Logout button
- Notification panel

### Landing experience
- Hero section
- Search panel
- Featured routes and tours cards
- Testimonials and call-to-action blocks

### Authentication experience
- Login form
- Registration form
- Google sign-in button
- Password reset flow

### Passenger booking experience
- Route filter inputs
- Route selection dropdown
- Seat map component
- Booking creation button
- Payment proof form
- Journey history list
- Summary cards

### Owner dashboard experience
- Stats summary cards
- Route creation/editing form
- Booking review list
- Payment review list
- Coupon form
- Tour package form
- Seat-block panel
- Export actions

### Connection between modules
- Auth state is shared globally and determines whether the user can access passenger or owner features.
- Passenger and owner flows share the same API layer and notification system.
- Booking and payment actions trigger updates in the owner dashboard and passenger journey lists.
- Seat changes are broadcast through Socket.IO so all relevant views stay synchronized.

---

## 10. Practical architecture summary
This app is best understood as a multi-role travel platform with:
- a polished frontend shell for public and logged-in experiences,
- a role-based routing model for passengers and bus owners,
- a shared backend API layer for bookings, payments, routes, tours, and notifications,
- and real-time seat synchronization to keep the booking experience responsive.

In short, the architecture is centered on one platform that serves two user roles while preserving a consistent experience and shared business logic.
