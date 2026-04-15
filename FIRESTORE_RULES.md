## Firestore Security Rules (Spark-friendly)

These rules let participants **read/write posts** for the Study thread using **Anonymous Auth**, while requiring a valid `studyCode` on every write. Posts also include `authorUid` (the anonymous auth uid) so edit/delete permissions can be enforced without deanonymizing participants.

### 1) Enable Anonymous Auth

In Firebase console:
- **Build → Authentication → Sign-in method → Anonymous → Enable**

### 2) Paste these rules

In Firebase console:
- **Build → Firestore Database → Rules**

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // Only allow the study codes we issued.
    function isAllowedStudyCode(code) {
      return code in ['YVES', 'JEON', 'PARK', 'HUR9', 'YEO1', 'YVBF'];
    }

    // Minimal shape validation for posts
    function isValidPostWrite() {
      return request.resource.data.keys().hasAll([
        'text', 'authorId', 'authorName', 'initials', 'authorUid', 'createdAtMs', 'studyCode'
      ])
      && request.resource.data.text is string
      && request.resource.data.text.size() > 0
      && request.resource.data.authorUid is string
      && request.resource.data.authorUid == request.auth.uid
      && request.resource.data.createdAtMs is int
      && request.resource.data.studyCode is string
      && isAllowedStudyCode(request.resource.data.studyCode);
    }

    match /studies/{studyId}/threads/{threadId}/posts/{postId} {
      allow read: if isSignedIn();

      allow create: if isSignedIn() && isValidPostWrite();

      // Allow edit/delete only by the original author (anonymous uid).
      allow update, delete: if isSignedIn() && resource.data.authorUid == request.auth.uid;
    }

    // Shared thread config (teacher-defined cluster labels)
    match /studies/{studyId}/threads/{threadId}/config/{configId} {
      allow read: if isSignedIn();

      allow write: if isSignedIn()
        && request.resource.data.studyCode is string
        && isAllowedStudyCode(request.resource.data.studyCode)
        && request.resource.data.clusters is list;
    }
  }
}
```

### 3) `authorId` vs `authorUid`

- `authorId`: the **display id** (TC###)
- `authorUid`: the **anonymous Firebase auth uid** used for permission checks

