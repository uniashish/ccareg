# Firestore Indexes - Phase 2 Setup

## ✅ OPTIMIZED Phase 2, Issue #3: Required Composite Indexes

These indexes optimize the filtered queries used in Phase 2 optimizations.

---

## Required Indexes

### 1. attendanceRecords - ccaId Index

**Collection:** `attendanceRecords`  
**Fields:**

- `ccaId` (Ascending)

**Used by:** AdminAttendanceModal (Issue #3 fix)  
**Impact:** Batch query for attendance records by CCA

```
Collection: attendanceRecords
├─ Field: ccaId (Ascending)
```

---

### 2. ccas - teacherInCharge Index

**Collection:** `ccas`  
**Fields:**

- `teacherInCharge` (Ascending)

**Used by:** TeacherDashboard (Phase 2, Issue #2 fix)  
**Impact:** Find CCAs assigned to a specific teacher

```
Collection: ccas
├─ Field: teacherInCharge (Ascending)
```

---

### 3. selections - selectedCCAs (Array)

**Collection:** `selections`  
**Fields:**

- `selectedCCAs` (Array)

**Used by:** VendorDashboard, TeacherDashboard  
**Impact:** Filter selections by CCA array membership

```
Collection: selections
├─ Field: selectedCCAs (Array)
```

---

### 4. vendors - email Index (Optional, but recommended)

**Collection:** `vendors`  
**Fields:**

- `email` (Ascending)

**Used by:** VendorDashboard (Issue #2 fix)  
**Impact:** Find vendor by email for filtering

```
Collection: vendors
├─ Field: email (Ascending)
```

---

## How to Create Indexes

### Option 1: Auto-Create (Easiest)

When you first run the optimized queries, Firebase will suggest creating indexes automatically.

1. Run the app with the optimizations
2. Check Firebase Console for suggested indexes
3. Click the link to create them automatically
4. Wait 5-10 minutes for indexing to complete

### Option 2: Firebase CLI

```bash
# Deploy indexes defined in firestore.indexes.json
firebase deploy --only firestore:indexes

# Create a new index
firebase firestore:indexes --region=us-central1
```

### Option 3: Manual Creation in Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database → Indexes**
4. Click **Create Index**
5. Fill in the collection and fields
6. Click **Create**

---

## firestore.indexes.json Example

Add this to your project's `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "attendanceRecords",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "ccaId",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "ccas",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "teacherInCharge",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "selections",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "selectedCCAs",
          "arrayConfig": "CONTAINS"
        }
      ]
    },
    {
      "collectionGroup": "vendors",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "email",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Status Checklist

Track the creation of each index:

- [ ] **attendanceRecords - ccaId** - Status: ✅ / ⏳ / ❌
- [ ] **ccas - teacherInCharge** - Status: ✅ / ⏳ / ❌
- [ ] **selections - selectedCCAs** - Status: ✅ / ⏳ / ❌
- [ ] **vendors - email** - Status: ✅ / ⏳ / ❌

---

## Verification

After creating indexes, verify they're working:

1. Open app with optimizations enabled
2. Navigate to pages using filtered queries
3. Check Firebase Console → Usage for reduced read count
4. Verify no "Missing composite index" errors in console

---

## Performance Impact

With these indexes:

- **Query speed:** 10-100x faster for large collections
- **Read operations:** Optimized to return only relevant data
- **Index size:** Minimal (< 1% of database size)
- **Cost:** Included in Firestore pricing (no extra charge)

---

## Troubleshooting

### Error: "Missing composite index"

- **Solution:** Create the missing index using Firebase Console
- **Time to resolve:** 5-10 minutes for indexing

### Query still slow after index creation

- **Cause:** Index not yet ready or field name mismatch
- **Solution:**
  1. Verify index is in "Enabled" state
  2. Check field names match exactly (case-sensitive)
  3. Wait 10 minutes and retry

### Can't create indexes

- **Cause:** Insufficient permissions
- **Solution:** Need Editor role on Firebase project

---

## References

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/composite-indexes)
- [Field Value Indexes](https://firebase.google.com/docs/firestore/query-data/index-types)

---

**Created as part of Phase 2 optimization** ✓
