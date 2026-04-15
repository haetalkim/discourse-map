# Discussion fixtures (synthetic scenarios)

Each JSON file has this shape:

```json
{
  "posts": [],
  "clusters": []
}
```

## Post objects

Match fields used in `INITIAL_POSTS` in `App.jsx`, for example:

- `id` (string, unique, e.g. `p1`)
- `authorId`, `authorName`, `initials`
- `date`, optional `lastReply`, `replyCount`
- `text`
- `clusterId` (primary theme)
- optional `clusterIds` (additional themes for multi-tag posts)
- `parentId` (`null` for root posts, else parent post `id`)

## Cluster objects

Match `INITIAL_CLUSTERS` in `App.jsx`:

- `id`, `label` (map lines may use `\n`), `shortLabel`
- `x`, `y`, `size` (numbers for map layout)
- `postIds` (array of post ids in this cluster — include every post that belongs here)
- `isGap` (boolean)
- optional `consensusWarning`, `isNew`

## Invariants

1. Every post appears in `postIds` on each cluster it belongs to (primary + any `clusterIds`).
2. Every `parentId` is `null` or references an existing `posts[].id`.
3. Every `clusterId` / entry in `clusterIds` exists as a `clusters[].id`.
4. Post `id` values are unique.

## Map chrome

`CONNECTIONS` and `KEYWORDS` in `App.jsx` are still global. Scenarios should use the **same cluster ids** as the default map unless you extend the loader to supply connections/keywords.

## Dev panel

In development, use **Synthetic test** (top-right) to load `surface`, `deep`, or `polarized` fixtures. Empty arrays fall back to clearing posts/clusters — prefer copying the default `INITIAL_*` data into a file as a starting point.
