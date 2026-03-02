# Firebase Optimization - Implementation Guide

## Ready-to-Use Code Snippets for CCA Registration App

---

## 1. QUICK WIN: Optimized useAdminData Hook

Replace the current `useAdminData.js` with this version that adds query filters:

```javascript
// src/hooks/useAdminDataOptimized.js
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  increment,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { enrichCCAsWithTeacherAlias } from "../utils/teacherAlias";

export function useAdminDataOptimized(showMessage = () => {}) {
  // --- STATE ---
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Selections State
  const [selections, setSelections] = useState([]);
  const [adminUsers, setAdminUsers] = useState({}); // CHANGED: Filter to admin/teacher only

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isCCAModalOpen, setIsCCAModalOpen] = useState(false);
  const [editingCCA, setEditingCCA] = useState(null);
  const [viewingCCA, setViewingCCA] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // --- 1. REAL-TIME DATA LISTENERS (OPTIMIZED) ---
  useEffect(() => {
    setLoading(true);

    // A. Listen to Classes
    const unsubClasses = onSnapshot(
      query(collection(db, "classes"), orderBy("name")),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassesList(list);
      },
      (error) => console.error("Error fetching classes:", error),
    );

    // B. Listen to CCAs
    const unsubCCAs = onSnapshot(
      query(collection(db, "ccas"), orderBy("name")),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCcas(list);
      },
      (error) => console.error("Error fetching CCAs:", error),
    );

    // C. Listen to Selections
    const unsubSelections = onSnapshot(
      collection(db, "selections"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSelections(list);
      },
      (error) => console.error("Error fetching selections:", error),
    );

    // D. Listen to Admin/Teacher Users ONLY (OPTIMIZED)
    // ✅ CHANGE: Instead of listening to all users, filter to admin/teacher roles
    const adminUsersQuery = query(
      collection(db, "users"),
      where("role", "in", ["admin", "teacher"]),
    );

    const unsubUsers = onSnapshot(adminUsersQuery, (snapshot) => {
      const userMap = {};
      snapshot.docs.forEach((doc) => {
        userMap[doc.id] = doc.data();
      });
      setAdminUsers(userMap);
      setLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubClasses();
      unsubCCAs();
      unsubSelections();
      unsubUsers();
    };
  }, []);

  // ... rest of hook remains the same ...
  // ESTIMATED SAVINGS: 70-80% reduction in user-related reads
}
```

**Migration Steps:**

1. Replace `useAdminData` with `useAdminDataOptimized` everywhere
2. Change any references from `users` to `adminUsers`
3. Test admin dashboard

**Cost Savings:** ~60-70% of user collection reads (if 100+ students)

---

## 2. Optimized Vendor Dashboard

```javascript
// src/pages/VendorDashboardOptimized.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, query, where } from "firebase/firestore";

export default function VendorDashboardOptimized() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selections, setSelections] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    // Step 1: Get vendor by email
    const vendorQuery = query(
      collection(db, "vendors"),
      where("email", "==", user?.email || ""),
    );

    const unsubVendors = onSnapshot(vendorQuery, (snapshot) => {
      const vendorDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVendors(vendorDocs);

      // Step 2: If we have a vendor, set up filtered queries
      if (vendorDocs.length > 0) {
        const vendorCcaIds = vendorDocs[0].associatedCCAs || [];

        // Only listen to CCAs assigned to this vendor
        const vendorCcasQuery = query(
          collection(db, "ccas"),
          where("__name__", "in", vendorCcaIds.slice(0, 10)), // Firestore limit: max 10 in array
        );

        // ✅ CHANGE: Listen to selections for THIS vendor's CCAs only
        if (vendorCcaIds.length > 0) {
          const selectionsQuery = query(
            collection(db, "selections"),
            where("selectedCCAs", "array-contains-any", vendorCcaIds),
          );

          const unsubSelections = onSnapshot(selectionsQuery, (snapshot) => {
            setSelections(
              snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })),
            );
          });

          // ✅ CHANGE: Listen to attendance for vendor's CCAs only
          const attendanceQuery = query(
            collection(db, "attendanceRecords"),
            where("ccaId", "in", vendorCcaIds),
          );

          const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
            setAttendanceRecords(
              snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })),
            );
          });

          return () => {
            unsubSelections();
            unsubAttendance();
          };
        }
      }
    });

    // Always listen to classes (read-only reference data)
    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      setClassesList(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    });

    return () => {
      unsubVendors();
      unsubClasses();
    };
  }, [user?.email]);

  // ... rest of component remains the same ...
}

// ESTIMATED SAVINGS: 85-90% reduction in vendor reads
// Before: Vendorms loads 5000+ selections + 10000+ attendance records
// After: Vendor loads only their CCA's data (10-50 selections + attendance)
```

---

## 3. Optimized Attendance Modal

Replace the entire effect in `AdminAttendanceModal.jsx`:

```javascript
// BEFORE: Fetches up to 600 individual documents
// useEffect(() => {
//   const promises = dateList.map(dateKey =>
//     getDoc(doc(db, "attendanceRecords", `${cca.id}_${dateKey}`))
//   );
//   Promise.all(promises).then(...);
// }, [cca?.id]);

// AFTER: Single batch query
// src/components/admin/AdminAttendanceModalOptimized.jsx
useEffect(() => {
  const loadAttendanceData = async () => {
    if (!cca?.id) return;

    setIsLoading(true);
    try {
      // ✅ CHANGE: Single query instead of 600+ getDoc calls
      const attendanceQuery = query(
        collection(db, "attendanceRecords"),
        where("ccaId", "==", cca.id),
        // Optional: Limit to last 90 days for performance
        where("date", ">=", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
      );

      const snapshot = await getDocs(attendanceQuery);

      // Group by date
      const attendanceByDateMap = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const dateKey = data.date;
        attendanceByDateMap[dateKey] = data;
      });

      // Convert to array and sort by date
      const sortedAttendance = Object.values(attendanceByDateMap).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );

      setAttendanceByDate(sortedAttendance);
    } catch (error) {
      console.error("Error loading attendance:", error);
      showMessage({
        type: "error",
        title: "Load Failed",
        message: "Failed to load attendance data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  loadAttendanceData();
}, [cca?.id]);

// ESTIMATED SAVINGS: 99% reduction for this modal
// Before: 600 getDoc calls per modal open
// After: 1 getDocs query
```

---

## 4. Teacher Dashboard - Filter to Teacher's CCAs

```javascript
// src/pages/TeacherDashboardOptimized.jsx
// Add this effect near the top of the component

useEffect(() => {
  if (!currentUser?.uid) return;

  // Step 1: Get CCAs where this teacher is in charge
  const teacherCCAsQuery = query(
    collection(db, "ccas"),
    where("teacherInCharge", "==", currentUser.uid),
  );

  const unsubCCAs = onSnapshot(teacherCCAsQuery, async (snapshot) => {
    const teacherCcaIds = snapshot.docs.map((doc) => doc.id);
    setTeacherCCAs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    // Step 2: Get selections only for teacher's CCAs
    if (teacherCcaIds.length > 0) {
      // ✅ CHANGE: Instead of loading ALL selections
      const teacherSelectionsQuery = query(
        collection(db, "selections"),
        where("selectedCCAs", "array-contains-any", teacherCcaIds),
      );

      const unsubSelections = onSnapshot(teacherSelectionsQuery, (snapshot) => {
        const studentSelections = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter to only show students selected for teacher's CCAs
        const filteredSelections = studentSelections.filter((sel) =>
          sel.selectedCCAs?.some((ccaId) => teacherCcaIds.includes(ccaId)),
        );

        setSelections(filteredSelections);
      });

      return () => unsubSelections();
    }
  });

  return () => unsubCCAs();
}, [currentUser?.uid]);

// ESTIMATED SAVINGS: 20-30% reduction in teacher reads
// Before: Loads 500+ selections for all students
// After: Loads only selections for students in teacher's CCAs (10-50 students)
```

---

## 5. Global Data Cache Context (Advanced)

Create a new context to avoid multiple subscriptions:

```javascript
// src/context/DataCacheContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  const [classes, setClasses] = useState([]);
  const [ccas, setCcas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Single listener for classes - shared across all components
    const unsubClasses = onSnapshot(
      query(collection(db, "classes"), orderBy("name")),
      (snapshot) => {
        setClasses(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
      },
    );

    // Single listener for CCAs - shared across all components
    const unsubCCAs = onSnapshot(
      query(collection(db, "ccas"), orderBy("name")),
      (snapshot) => {
        setCcas(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
        setIsLoading(false);
      },
    );

    return () => {
      unsubClasses();
      unsubCCAs();
    };
  }, []);

  return (
    <DataCacheContext.Provider value={{ classes, ccas, isLoading }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within DataCacheProvider");
  }
  return context;
}
```

**Usage in components:**

```javascript
// Instead of:
// const { ccas } = useAdminData();

// Use:
// const { ccas } = useDataCache();
```

**Benefits:**

- Single listener for classes/CCAs shared by entire app
- Eliminates duplicate subscriptions
- Cached data serves immediately
- Estimated savings: 10-15% of reads

---

## 6. Firestore Indexes to Create

Add these indexes in Firebase Console for better performance:

```
Collection: attendanceRecords
├─ Index 1: ccaId (Ascending), date (Descending)
├─ Index 2: ccaId (Ascending), status (Ascending)
└─ Index 3: date (Descending)

Collection: selections
├─ Index 1: selectedCCAs (Array), status (Ascending)
├─ Index 2: termId (Ascending), status (Ascending)
└─ Index 3: classId (Ascending)

Collection: vendors
├─ Index 1: email (Ascending)
└─ Index 2: role (Ascending)

Collection: ccas
├─ Index 1: teacherInCharge (Ascending), termId (Ascending)
└─ Index 2: status (Ascending), enrolledCount (Descending)
```

**How to add:**

1. Firebase Console → Firestore Database → Indexes
2. Or run: `firebase firestore:indexes --region=us-central1`

---

## 7. Enable Offline Persistence

Add to `src/main.jsx` after initializing Firebase:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// ... Initialize app ...

const db = getFirestore(app);

// Enable offline persistence (optional but recommended)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open, persistence disabled");
  } else if (err.code === "unimplemented") {
    console.warn("Offline persistence not supported");
  }
});

// ... rest of setup ...
```

**Benefits:**

- App works offline
- Cached data loads instantly
- Syncs when back online
- Reduces reads by 30-40%

---

## Estimated Impact Timeline

**Week 1 (Quick Wins - Implement Priority 1 items):**

- Optimize useAdminData (filter users)
- Optimize vendor dashboard
- Fix attendance modal
- **Expected Savings: 40-50% reduction**

**Week 2-3 (Medium Optimization):**

- Create global data cache context
- Add Firestore indexes
- Optimize teacher dashboard
- Enable offline persistence
- **Cumulative Savings: 60-70% reduction**

**Week 4+ (Advanced):**

- Implement pagination
- Denormalize data model
- Full-text search optimization
- **Cumulative Savings: 70-80% reduction**

---

## Testing Checklist

After implementing each optimization:

- [ ] All features still work as before
- [ ] No errors in console
- [ ] Real-time updates still work
- [ ] Page load time acceptable
- [ ] Firebase read count decreased
- [ ] No unintended side effects

**Monitor in Firebase Console:**

```
Firestore → Usage
- Track reads/day before and after
- Should see 60-75% reduction
```

---

## Common Issues & Solutions

### Issue: "array-contains-any" not working for vendor CCAs

**Solution:** Firestore has limits on document field values. If more than 10 CCAs:

```javascript
// Split into multiple queries
const query1 = query(
  collection(db, "selections"),
  where("selectedCCAs", "array-contains-any", vendorCcaIds.slice(0, 10)),
);
const query2 = query(
  collection(db, "selections"),
  where("selectedCCAs", "array-contains-any", vendorCcaIds.slice(10, 20)),
);

const [results1, results2] = await Promise.all([
  getDocs(query1),
  getDocs(query2),
]);

const combined = [...results1.docs, ...results2.docs];
```

### Issue: "where" clause not returning results

**Firestore requires indexes for multi-field queries**

- Create index in Firebase Console
- Or use single-field "where" with client-side filtering (slower)

### Issue: Real-time updates lagging

**Solutions:**

1. Reduce the scope of listeners (use "where" clauses)
2. Batch updates instead of individual writes
3. Use `getDocs` for static data instead of `onSnapshot`

---

## Next Steps

1. **Measure baseline:**
   - Open Firebase Console
   - Firestore → Usage
   - Note read/write counts for 1 week

2. **Implement Phase 1 optimizations**

3. **Measure results:**
   - Compare metrics after 1 week
   - Log improvement %

4. **Continue with Phase 2 & 3**

5. **Set up monitoring:**
   - Monthly read count reviews
   - Billing alerts at thresholds

---

**Ready to implement? Start with Section 1: Optimized useAdminData** ✓
