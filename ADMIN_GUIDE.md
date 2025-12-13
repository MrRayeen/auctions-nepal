# Admin Panel Guide

## Access Admin Panel

1. Navigate to: `http://localhost:3000/admin/login`
2. **Username:** `potato`
3. **Password:** `sauce???`

## Admin Dashboard Features

### Dashboard Statistics
- **Total Auctions:** Count of all auctions in the system
- **Active Auctions:** Auctions still accepting bids
- **Total Bids:** Sum of all bids across all auctions
- **Total Value:** Sum of all current auction prices

### Auction Management
- **View All Auctions:** Complete list with thumbnails, current prices, bid counts
- **View Auction Details:** Click the eye icon to view full auction details
- **Delete Auctions:** Click trash icon, confirm deletion to remove auction from database
- **Real-time Updates:** Dashboard shows time remaining for each active auction

### Features
- Beautiful glass-panel UI design matching main site
- Admin-only route protection (redirects to login if not authenticated)
- Confirmation modal before deleting auctions
- Toast notifications for all actions
- Responsive design for mobile and desktop
- Logout button in top-right corner

## API Endpoints

### Delete Auction
```
DELETE /api/auctions/[id]
Headers: x-admin-token: "admin-secret-key"
Response: { success: true, message: "Auction deleted", auctionId: 1 }
```

## Security Notes

- Admin token stored in localStorage (base64 encoded timestamp)
- Admin access requires correct hardcoded credentials
- Delete operations require admin token verification
- All admin routes check for valid authentication on page load
