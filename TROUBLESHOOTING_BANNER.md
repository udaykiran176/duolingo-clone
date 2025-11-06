# Troubleshooting: Banner Not Showing

If the announcement banner is not appearing on the homepage, check these items:

## ✅ Checklist

### 1. Database Migration
**Run the migration first:**
```bash
npm run db:push
```

This creates the `announcements` table. Without this, the banner won't show.

### 2. Create an Active Announcement
1. Go to `/admin/announcements`
2. Click "Create Announcement"
3. Fill in:
   - **Title**: Any title (e.g., "Test Announcement")
   - **Message**: Any message (e.g., "This is a test")
   - **Link**: Optional (can leave empty)
   - **Active**: ✅ Make sure this is checked/toggled ON
4. Click "Create"

### 3. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for any errors
- **Network tab**: Check if `/api/announcements` request is successful (200 status)

### 4. Clear localStorage
If you dismissed a banner before, clear it:
```javascript
localStorage.removeItem("dismissed-announcement-id");
```

### 5. Verify Database
Check if announcement exists and is active:
```sql
SELECT * FROM announcements WHERE is_active = true;
```

### 6. Check Scroll Position
The banner auto-hides when you scroll down. Make sure you're at the top of the page (scrollY = 0).

## 🔍 Debug Steps

### Test the API Directly
Visit: `http://localhost:3000/api/announcements`

You should see:
```json
{
  "announcement": {
    "id": 1,
    "title": "Your Title",
    "message": "Your Message",
    "link": null,
    "isActive": true,
    "createdAt": "2024-..."
  }
}
```

If you see `{"announcement": null}`, there's no active announcement in the database.

### Check React Query
Open React Query DevTools (if installed) and check:
- Query key: `["announcement"]`
- Status: Should be "success"
- Data: Should contain the announcement object

## 🎯 Common Issues

### Issue: "No announcement showing"
**Solution**: Create an active announcement in `/admin/announcements`

### Issue: "Banner appears then disappears"
**Solution**: Check if you scrolled down (banner auto-hides on scroll)

### Issue: "Banner doesn't show after creating"
**Solution**: 
- Wait a few seconds (React Query refetches every 60s)
- Or refresh the page
- Or check if `isActive` is set to `true`

### Issue: "Database error"
**Solution**: 
- Run `npm run db:push` to create the table
- Check database connection in `.env`
- Verify `DATABASE_URL` is correct

## 📝 Quick Test

1. **Create test announcement:**
   - Title: "Test"
   - Message: "Testing banner"
   - Active: ✅ ON

2. **Visit homepage:** `/`

3. **Expected:** Orange banner at top with "🎉 Test Testing banner"

If it still doesn't show, check browser console for errors.

